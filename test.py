import asyncio
import os

from dotenv import load_dotenv
from twikit import Client

load_dotenv()

client = Client("en-US")


async def main():
    await client.login(
        auth_info_1=os.getenv("X_USERNAME"),
        auth_info_2=os.getenv("X_EMAIL"),
        password=os.getenv("X_PASSWORD"),
        cookies_file="cookies.json",
    )

    print("Logged in successfully!")


asyncio.run(main())