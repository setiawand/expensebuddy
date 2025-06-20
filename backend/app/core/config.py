from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "ExpenseBuddy"
    allowed_hosts: list[str] = ["*"]

settings = Settings()
