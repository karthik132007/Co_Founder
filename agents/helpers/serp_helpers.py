import logging
import os

import serpapi

logger = logging.getLogger(__name__)

api = os.getenv('SERP_API_KEY')

client = serpapi.Client(api_key=api)

def search_google_trends(query:str):
    logger.info("search_google_trends called: query='%s'", query)
    results = client.search({
        "engine":"google_trends",
        "q":query,
        "date":"today 12-m",
        "data_type":"TIMESERIES"
    })
    trends = results.get("interest_over_time", [])
    logger.info("Google trends returned %d items", len(trends))
    return trends

def search_google_news(query:str):
    logger.info("search_google_news called: query='%s'", query)
    results = client.search({
        "engine": "google_news",
        "q": query,
    })
    news = results.get("news_results", [])
    logger.info("Google news returned %d items", len(news))
    return news

def search_google_shopping(query:str):
    logger.info("search_google_shopping called: query='%s'", query)
    results = client.search({
        "engine": "google_shopping",
        "q": query,
    })
    shopping = results.get("shopping_results", [])
    logger.info("Google shopping returned %d items", len(shopping))
    return shopping
