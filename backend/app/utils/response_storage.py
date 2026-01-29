"""
Local response storage manager
Saves all scraping responses to local files for backup and analysis
"""
import os
from datetime import datetime
from typing import Optional
from loguru import logger
from app.config import settings


class ResponseStorage:
    """
    Manages local file storage of scraping responses
    Organizes files by date and AI platform
    """
    
    def __init__(self):
        """Initialize storage manager"""
        self.base_path = os.path.join(settings.STORAGE_PATH, 'responses')
        os.makedirs(self.base_path, exist_ok=True)
        logger.info(f"📁 Response storage initialized at {self.base_path}")
    
    def save_response(
        self,
        response_id: str,
        ai_source: str,
        prompt: str,
        response_text: str,
        brands_mentioned: list,
        timestamp: Optional[datetime] = None
    ) -> str:
        """
        Save a response to local file
        
        Args:
            response_id: UUID of the response
            ai_source: AI platform (chatgpt, gemini, etc.)
            prompt: The query text
            response_text: The AI's response
            brands_mentioned: List of brands found
            timestamp: When the response was created (defaults to now)
            
        Returns:
            Path to saved file
        """
        if timestamp is None:
            timestamp = datetime.now()
        
        # Create directory structure: responses/YYYY-MM-DD/ai_source/
        date_str = timestamp.strftime('%Y-%m-%d')
        platform_dir = os.path.join(self.base_path, date_str, ai_source)
        os.makedirs(platform_dir, exist_ok=True)
        
        # Create filename with timestamp and ID
        time_str = timestamp.strftime('%H-%M-%S')
        filename = f"{time_str}_{response_id[:8]}.txt"
        filepath = os.path.join(platform_dir, filename)
        
        # Prepare content
        separator = "=" * 80
        content = f"""{separator}
SCRAPE RESPONSE - {ai_source.upper()}
{separator}

Response ID: {response_id}
Timestamp: {timestamp.strftime('%Y-%m-%d %H:%M:%S')}
AI Platform: {ai_source}

{separator}
PROMPT
{separator}

{prompt}

{separator}
RESPONSE
{separator}

{response_text}

{separator}
BRANDS MENTIONED ({len(brands_mentioned)})
{separator}

{', '.join(brands_mentioned) if brands_mentioned else 'None'}

{separator}
END OF RESPONSE
{separator}
"""
        
        # Write to file
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            
            logger.info(f"💾 Response saved to: {filepath}")
            return filepath
            
        except Exception as e:
            logger.error(f"❌ Failed to save response to file: {e}")
            return ""
    
    def get_response_path(self, response_id: str, ai_source: str, timestamp: datetime) -> str:
        """
        Get the file path for a specific response
        
        Args:
            response_id: UUID of the response
            ai_source: AI platform
            timestamp: When the response was created
            
        Returns:
            Full path to the response file
        """
        date_str = timestamp.strftime('%Y-%m-%d')
        time_str = timestamp.strftime('%H-%M-%S')
        filename = f"{time_str}_{response_id[:8]}.txt"
        
        return os.path.join(self.base_path, date_str, ai_source, filename)
    
    def list_responses(self, ai_source: Optional[str] = None, date: Optional[str] = None) -> list:
        """
        List all stored response files
        
        Args:
            ai_source: Filter by AI platform (optional)
            date: Filter by date in YYYY-MM-DD format (optional)
            
        Returns:
            List of file paths
        """
        responses = []
        
        try:
            if date:
                # Search specific date
                search_path = os.path.join(self.base_path, date)
                if ai_source:
                    search_path = os.path.join(search_path, ai_source)
            else:
                # Search all dates
                search_path = self.base_path
            
            # Walk through directory structure
            for root, dirs, files in os.walk(search_path):
                for file in files:
                    if file.endswith('.txt'):
                        responses.append(os.path.join(root, file))
            
            return sorted(responses, reverse=True)  # Most recent first
            
        except Exception as e:
            logger.error(f"❌ Error listing responses: {e}")
            return []
    
    def get_storage_stats(self) -> dict:
        """
        Get statistics about stored responses
        
        Returns:
            Dictionary with storage statistics
        """
        stats = {
            'total_responses': 0,
            'by_platform': {},
            'by_date': {},
            'total_size_mb': 0
        }
        
        try:
            for root, dirs, files in os.walk(self.base_path):
                for file in files:
                    if file.endswith('.txt'):
                        stats['total_responses'] += 1
                        
                        # Get file size
                        filepath = os.path.join(root, file)
                        size = os.path.getsize(filepath)
                        stats['total_size_mb'] += size / (1024 * 1024)
                        
                        # Extract platform and date from path
                        parts = root.replace(self.base_path, '').strip(os.sep).split(os.sep)
                        if len(parts) >= 2:
                            date = parts[0]
                            platform = parts[1]
                            
                            stats['by_platform'][platform] = stats['by_platform'].get(platform, 0) + 1
                            stats['by_date'][date] = stats['by_date'].get(date, 0) + 1
            
            return stats
            
        except Exception as e:
            logger.error(f"❌ Error getting storage stats: {e}")
            return stats


# Global response storage instance
response_storage = ResponseStorage()
