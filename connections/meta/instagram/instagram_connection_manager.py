import os
import httpx
from backend.db.connections import put_to_insta_table, get_from_insta_table
#TODO from agents.util_agents.image_description import get_image_description #needs image bytes
from datetime import datetime, timezone, timedelta
class Instagram_Connection_Manager():
    def __init__(self):
        self.INSTAGRAM_APP_ID = os.getenv("INSTAGRAM_APP_ID")
        self.INSTAGRAM_APP_SECRET = os.getenv("INSTAGRAM_APP_SECRET")
        self.INSTAGRAM_REDIRECT_URI = os.getenv("INSTAGRAM_REDIRECT_URI")
        
        
    async def get_instagram_connection(self,company_id: int,):
        connection_data = get_from_insta_table(
            company_id
        )

        if not connection_data:
            raise RuntimeError(
                f"No Instagram connection found for "
                f"company_id {company_id}"
            )

        return connection_data
    
    async def get_instagram_access_token_from_db(self,company_id: int):
        try:
            connection_data = get_from_insta_table(company_id)
            if connection_data is None:
                raise RuntimeError(f"No Instagram connection found for company_id {company_id}")
            return connection_data.get("access_token")
        except Exception as e:
            raise RuntimeError(f"Failed to retrieve Instagram access token: {e}")
    
    def store_instagram_access_token_in_db(self,company_id: int,data:dict):

        access_token=data.get("access_token")
        instagram_user_id=data.get("user_id")
        expires_at=data.get("expires_at")
        try:
            put_to_insta_table(
                company_id=company_id,
                instagram_user_id=instagram_user_id,
                access_token=access_token,
                expires_at=expires_at
            )
        except Exception as e:
            raise RuntimeError(f"Failed to store Instagram access token: {e}")
        

    async def exchange_instagram_code(self,code: str):

        data = {
            "client_id": self.INSTAGRAM_APP_ID,
            "client_secret": self.INSTAGRAM_APP_SECRET,
            "grant_type": "authorization_code",
            "redirect_uri": self.INSTAGRAM_REDIRECT_URI,
            "code": code,
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.instagram.com/oauth/access_token",
                data=data,
            )

        response.raise_for_status()

        return response.json()
    
    async def get_long_lived_token(self,short_token: str):

        params = {
            "grant_type": "ig_exchange_token",
            "client_secret": self.INSTAGRAM_APP_SECRET,
            "access_token": short_token,
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://graph.instagram.com/access_token",
                params=params,
            )

        response.raise_for_status()

        return response.json()

class Instagram_Connection_Manager_Agent_Side(Instagram_Connection_Manager):
    
    def __init__(self):
        super().__init__()

    async def get_instagram_details(
        self,
        company_id: int
    ):
        access_token = (
            await self.get_instagram_access_token_from_db(
                company_id
            )
        )

        params = {
            "fields": "id,username,account_type,media_count",
            "access_token": access_token,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                "https://graph.instagram.com/me",
                params=params,
            )

        response.raise_for_status()

        return response.json()
    
    async def get_instagram_recent_activity(self,company_id: int,n_days: int = 7,include_image_descriptions: bool = False):

        access_token = (
            await self.get_instagram_access_token_from_db(
                company_id
            )
        )

        params = {
            "fields": (
                "id,"
                "caption,"
                "media_type,"
                "media_url,"
                "permalink,"
                "timestamp"
            ),
            "access_token": access_token,
            "limit": 50,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                "https://graph.instagram.com/me/media",
                params=params,
            )

        response.raise_for_status()

        data = response.json()

        media = data.get("data", [])

        cutoff = (
            datetime.now(timezone.utc)
            - timedelta(days=n_days)
        )

        recent_media = []

        for item in media:

            timestamp = item.get("timestamp")

            if not timestamp:
                continue

            created_at = datetime.fromisoformat(
                timestamp.replace("Z", "+00:00")
            )

            if created_at >= cutoff:
                recent_media.append(item)

        return recent_media
        
    async def post_instagram_content(self,company_id: int, content: dict):
        connection = await self.get_instagram_connection(company_id)

        access_token = connection["access_token"]
        instagram_user_id = connection["instagram_user_id"]

        image_url = content.get("image_url")
        caption = content.get("caption", "")
        
        if not image_url:
            raise ValueError("Image URL is required for posting content.")
        
        params = {
        "image_url": image_url,
        "caption": caption,
        "access_token": access_token,
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:

            response = await client.post(
                f"https://graph.instagram.com/"
                f"{instagram_user_id}/media",
                params=params,
            )
        
        response.raise_for_status()

        container = response.json()

        creation_id = container["id"]
        
        publish_params = {
        "creation_id": creation_id,
        "access_token": access_token,
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:

            response = await client.post(
                f"https://graph.instagram.com/"
                f"{instagram_user_id}/media_publish",
                params=publish_params,
            )

        response.raise_for_status()

        return response.json()
    
    
instagram_manager=Instagram_Connection_Manager_Agent_Side()
