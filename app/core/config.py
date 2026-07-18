from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30
    smtp_host: str
    smtp_port: int = 587
    smtp_user: str
    smtp_password: str
    frontend_url: str = "http://localhost:5173"
    # Sigurno po defaultu - ako produkcijski .env slucajno ne postavi
    # COOKIE_SECURE, refresh cookie i dalje ide samo preko HTTPS-a. Lokalni
    # dev (plain HTTP) mora eksplicitno postaviti COOKIE_SECURE=false u .env.
    cookie_secure: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
