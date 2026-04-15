import os
import logging
from typing import ClassVar

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class Settings:
    """Application settings loaded from environment variables."""

    WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "base")
    SPACY_MODEL: str = os.getenv("SPACY_MODEL", "en_core_web_sm")
    MAX_AUDIO_DURATION: int = int(os.getenv("MAX_AUDIO_DURATION", "300"))
    SUPPORTED_FORMATS: ClassVar[list[str]] = ["wav", "mp3", "ogg", "flac", "m4a", "webm"]
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8100"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    TEMP_DIR: str = os.getenv("TEMP_DIR", "/tmp/voice-ai")
    CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "*").split(",")
    WHISPER_DEVICE: str = os.getenv("WHISPER_DEVICE", "cpu")
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))

    @classmethod
    def configure_logging(cls) -> None:
        logging.basicConfig(
            level=getattr(logging, cls.LOG_LEVEL.upper(), logging.INFO),
            format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )


settings = Settings()
