class ConnectionManager:
    def __init__(self):
        self.connection_types = ["google", "instagram"]
        
    def connect_instagram(self,company_id: str, access_token: str):
       
        if not company_id:
           raise ValueError("Company ID is required")
       
        if not access_token:
           raise ValueError("Access token is required")
       
       
    