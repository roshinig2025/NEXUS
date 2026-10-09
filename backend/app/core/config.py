from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_path: str = "models/model.joblib"
    data_path: str = "data/raw_dataset.joblib"
    cors_allow_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    cors_allow_methods: list[str] = ["*"]
    cors_allow_headers: list[str] = ["*"]
    cors_allow_credentials: bool = True

    class Config:
        env_prefix = "APP_"
        extra = "allow"


settings = Settings()
