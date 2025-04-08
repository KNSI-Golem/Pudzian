from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    AWS_BUCKET: str
    PROFILE: str
    SUPPORTED_FILE_TYPES: dict = {
        "video/mp4": "mp4",
        "video/quicktime": "quicktime"
    }

    model_config = SettingsConfigDict(env_file=".env")
