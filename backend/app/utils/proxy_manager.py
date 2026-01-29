"""
Oxylabs Proxy Manager
Handles proxy rotation and configuration for Oxylabs datacenter proxies
"""
import random
from typing import Optional, Dict
from loguru import logger
from app.config import settings


class ProxyManager:
    """
    Manages Oxylabs proxy rotation
    
    Proxies are rotated randomly to distribute load and avoid rate limiting
    """
    
    def __init__(self):
        """Initialize proxy manager with Oxylabs configuration"""
        self.username = settings.OXYLABS_USERNAME
        self.password = settings.OXYLABS_PASSWORD
        self.host = settings.OXYLABS_PROXY_HOST
        
        # Parse ports from comma-separated string
        self.ports = [
            port.strip() 
            for port in settings.OXYLABS_PROXY_PORTS.split(',')
            if port.strip()
        ]
        
        if not self.ports:
            logger.warning("⚠️  No proxy ports configured!")
        else:
            logger.info(f"🔒 Loaded {len(self.ports)} Oxylabs proxy endpoints")
    
    def get_random_proxy(self) -> Optional[str]:
        """
        Get a random proxy URL for rotation
        
        Returns:
            Proxy URL in format: http://user-USERNAME:PASSWORD@dc.oxylabs.io:8001
            Or None if proxies not configured
        """
        if not settings.USE_PROXY:
            logger.warning("⚠️  USE_PROXY is False - running without proxy!")
            return None
        
        if not self.username or not self.password:
            logger.error("❌ Oxylabs credentials not configured in .env file!")
            return None
        
        if not self.ports:
            logger.error("❌ No proxy ports configured!")
            return None
        
        # Select random port for rotation
        port = random.choice(self.ports)
        
        # Format for Oxylabs datacenter proxies: http://customer-USERNAME:PASSWORD@dc.oxylabs.io:PORT
        proxy_url = f"http://user-{self.username}:{self.password}@{self.host}:{port}"
        
        logger.debug(f"🔒 Using proxy: {self.host}:{port}")
        return proxy_url
    
    def get_proxy_for_selenium(self) -> Optional[str]:
        """
        Get proxy URL formatted for Selenium/Chrome
        
        Returns:
            Proxy URL without credentials (Chrome handles auth separately)
            Format: http://dc.oxylabs.io:8001
        """
        if not settings.USE_PROXY or not self.ports:
            return None
        
        port = random.choice(self.ports)
        proxy_url = f"{self.host}:{port}"
        
        logger.debug(f"🔒 Selenium proxy: {proxy_url}")
        return proxy_url
    
    def get_proxy_dict(self) -> Optional[Dict[str, str]]:
        """
        Get proxy configuration as dictionary for requests library
        
        Returns:
            Dictionary with http/https proxy URLs
            Example: {"http": "http://user-...", "https": "https://user-..."}
        """
        proxy_url = self.get_random_proxy()
        if not proxy_url:
            return None
        
        # Use same proxy for both HTTP and HTTPS
        return {
            "http": proxy_url,
            "https": proxy_url.replace("http://", "https://")
        }
    
    def test_proxy(self) -> bool:
        """
        Test proxy connection to Oxylabs
        
        Returns:
            True if proxy works, False otherwise
        """
        import requests
        
        proxy_dict = self.get_proxy_dict()
        if not proxy_dict:
            logger.error("❌ No proxy configured for testing")
            return False
        
        try:
            logger.info("🧪 Testing Oxylabs proxy connection...")
            response = requests.get(
                "https://ip.oxylabs.io/location",
                proxies=proxy_dict,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.success(f"✅ Proxy working! Response: {response.text[:100]}")
                return True
            else:
                logger.error(f"❌ Proxy test failed with status {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Proxy test failed: {e}")
            return False
    
    def get_auth_extension_path(self) -> Optional[str]:
        """
        Create Chrome extension for proxy authentication
        This is needed because Chrome doesn't support proxy auth in command line
        
        Returns:
            Path to Chrome extension directory
        """
        import os
        import zipfile
        
        if not settings.USE_PROXY or not self.username:
            return None
        
        proxy_url = self.get_proxy_for_selenium()
        if not proxy_url:
            return None
        
        # Parse host and port
        host, port = proxy_url.split(':')
        
        # Extension directory
        ext_dir = os.path.join(settings.STORAGE_PATH, 'proxy_auth_extension')
        os.makedirs(ext_dir, exist_ok=True)
        
        # Create manifest.json
        manifest = {
            "version": "1.0.0",
            "manifest_version": 2,
            "name": "Oxylabs Proxy Auth",
            "permissions": [
                "proxy",
                "tabs",
                "unlimitedStorage",
                "storage",
                "<all_urls>",
                "webRequest",
                "webRequestBlocking"
            ],
            "background": {
                "scripts": ["background.js"]
            },
            "minimum_chrome_version": "22.0.0"
        }
        
        # Create background.js
        background_js = f"""
var config = {{
    mode: "fixed_servers",
    rules: {{
        singleProxy: {{
            scheme: "http",
            host: "{host}",
            port: parseInt({port})
        }},
        bypassList: ["localhost"]
    }}
}};

chrome.proxy.settings.set({{value: config, scope: "regular"}}, function() {{}});

function callbackFn(details) {{
    return {{
        authCredentials: {{
            username: "user-{self.username}",
            password: "{self.password}"
        }}
    }};
}}

chrome.webRequest.onAuthRequired.addListener(
    callbackFn,
    {{urls: ["<all_urls>"]}},
    ['blocking']
);
"""
        
        # Write files
        import json
        with open(os.path.join(ext_dir, 'manifest.json'), 'w') as f:
            json.dump(manifest, f, indent=2)
        
        with open(os.path.join(ext_dir, 'background.js'), 'w') as f:
            f.write(background_js)
        
        logger.info(f"✅ Created proxy auth extension at {ext_dir}")
        return ext_dir


# Global proxy manager instance
proxy_manager = ProxyManager()
