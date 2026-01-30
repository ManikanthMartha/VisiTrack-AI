"""
Test LLM extraction on existing responses
Run this to extract data from responses that were scraped before LLM feature was added
"""
import asyncio
from loguru import logger
from app.database import db
from app.utils.llm_extractor import LLMExtractor
from app.config import settings


async def test_extraction():
    """Test LLM extraction on a few existing responses"""
    
    logger.info("=" * 80)
    logger.info("🧪 Testing LLM Extraction")
    logger.info("=" * 80)
    
    if not settings.GOOGLE_API_KEY:
        logger.error("❌ GOOGLE_API_KEY not set in .env file")
        logger.info("Get your free API key from: https://aistudio.google.com/app/apikey")
        return
    
    # Get a few completed responses
    logger.info("📊 Fetching completed responses...")
    result = db.client.table('responses')\
        .select('*')\
        .eq('status', 'completed')\
        .not_.is_('brands_mentioned', 'null')\
        .limit(3)\
        .execute()
    
    if not result.data:
        logger.warning("⚠️ No completed responses found")
        return
    
    responses = result.data
    logger.info(f"✅ Found {len(responses)} responses to test")
    
    # Initialize extractor
    extractor = LLMExtractor()
    
    for i, response in enumerate(responses, 1):
        logger.info("\n" + "=" * 80)
        logger.info(f"Testing Response {i}/{len(responses)}")
        logger.info("=" * 80)
        logger.info(f"Response ID: {response['id']}")
        logger.info(f"AI Source: {response['ai_source']}")
        logger.info(f"Brands Mentioned: {', '.join(response['brands_mentioned'])}")
        logger.info(f"Response Length: {len(response['response_text'])} chars")
        
        # Extract data
        extracted_data = extractor.extract_all_data(
            response_text=response['response_text'],
            brands_mentioned=response['brands_mentioned'],
            prompt_text=response['prompt_text']
        )
        
        # Display results
        logger.info("\n📊 Extraction Results:")
        for brand_name, brand_data in extracted_data.get('brands', {}).items():
            logger.info(f"\n🏷️  Brand: {brand_name}")
            logger.info(f"   Sentiment: {brand_data.get('sentiment', 'N/A')}")
            logger.info(f"   Keywords: {', '.join(brand_data.get('keywords', []))}")
            logger.info(f"   Citations: {len(brand_data.get('citations', []))}")
            logger.info(f"   Context: {brand_data.get('context', 'N/A')[:100]}...")
            
            # Show citations
            for j, citation in enumerate(brand_data.get('citations', []), 1):
                logger.info(f"      Citation {j}: {citation.get('url', 'N/A')}")
        
        # Ask if user wants to save
        logger.info("\n" + "=" * 80)
        save = input("💾 Save this extraction to database? (y/n): ").strip().lower()
        
        if save == 'y':
            logger.info("💾 Saving to database...")
            
            for brand_name, brand_data in extracted_data.get('brands', {}).items():
                # Save citations
                if brand_data.get('citations'):
                    await db.save_citations(
                        response_id=response['id'],
                        brand_name=brand_name,
                        citations=brand_data['citations']
                    )
                
                # Save mention context
                await db.save_brand_mention(
                    response_id=response['id'],
                    brand_name=brand_name,
                    mention_data=brand_data
                )
            
            logger.success("✅ Saved to database")
        else:
            logger.info("⏭️  Skipped")
    
    logger.info("\n" + "=" * 80)
    logger.info("✅ Test Complete")
    logger.info("=" * 80)


async def batch_extract_all():
    """Extract data from ALL existing responses (use with caution - rate limits!)"""
    
    logger.warning("=" * 80)
    logger.warning("⚠️  BATCH EXTRACTION - This will process ALL responses")
    logger.warning("=" * 80)
    
    confirm = input("Are you sure? This may take a while and use API quota. (yes/no): ").strip().lower()
    if confirm != 'yes':
        logger.info("❌ Cancelled")
        return
    
    # Get all completed responses without citations
    logger.info("📊 Fetching responses...")
    result = db.client.table('responses')\
        .select('*')\
        .eq('status', 'completed')\
        .not_.is_('brands_mentioned', 'null')\
        .execute()
    
    if not result.data:
        logger.warning("⚠️ No responses found")
        return
    
    responses = result.data
    logger.info(f"✅ Found {len(responses)} responses")
    
    # Filter out responses that already have citations
    responses_to_process = []
    for response in responses:
        # Check if citations exist
        citations = db.client.table('citations')\
            .select('id')\
            .eq('response_id', response['id'])\
            .limit(1)\
            .execute()
        
        if not citations.data:
            responses_to_process.append(response)
    
    logger.info(f"📋 {len(responses_to_process)} responses need extraction")
    
    if not responses_to_process:
        logger.info("✅ All responses already have citations")
        return
    
    # Initialize extractor
    extractor = LLMExtractor()
    
    success_count = 0
    error_count = 0
    
    for i, response in enumerate(responses_to_process, 1):
        logger.info(f"\n[{i}/{len(responses_to_process)}] Processing {response['id']}...")
        
        try:
            # Extract data
            extracted_data = extractor.extract_all_data(
                response_text=response['response_text'],
                brands_mentioned=response['brands_mentioned'],
                prompt_text=response['prompt_text']
            )
            
            # Save to database
            for brand_name, brand_data in extracted_data.get('brands', {}).items():
                if brand_data.get('citations'):
                    await db.save_citations(
                        response_id=response['id'],
                        brand_name=brand_name,
                        citations=brand_data['citations']
                    )
                
                await db.save_brand_mention(
                    response_id=response['id'],
                    brand_name=brand_name,
                    mention_data=brand_data
                )
            
            success_count += 1
            logger.success(f"✅ [{i}/{len(responses_to_process)}] Success")
            
            # Rate limiting - wait 4 seconds between requests (15/min limit)
            if i < len(responses_to_process):
                await asyncio.sleep(4)
            
        except Exception as e:
            error_count += 1
            logger.error(f"❌ [{i}/{len(responses_to_process)}] Error: {e}")
    
    logger.info("\n" + "=" * 80)
    logger.info("📊 BATCH EXTRACTION COMPLETE")
    logger.info(f"✅ Success: {success_count}")
    logger.info(f"❌ Errors: {error_count}")
    logger.info("=" * 80)


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--batch':
        asyncio.run(batch_extract_all())
    else:
        asyncio.run(test_extraction())
