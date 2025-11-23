import logging
import sys
from typing import Any

# Color codes for terminal output
class Colors:
    """ANSI color codes for terminal output"""
    RESET = "\033[0m"
    BOLD = "\033[1m"
    
    # Colors
    BLACK = "\033[30m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    BLUE = "\033[34m"
    MAGENTA = "\033[35m"
    CYAN = "\033[36m"
    WHITE = "\033[37m"
    
    # Bright colors
    BRIGHT_BLACK = "\033[90m"
    BRIGHT_RED = "\033[91m"
    BRIGHT_GREEN = "\033[92m"
    BRIGHT_YELLOW = "\033[93m"
    BRIGHT_BLUE = "\033[94m"
    BRIGHT_MAGENTA = "\033[95m"
    BRIGHT_CYAN = "\033[96m"
    BRIGHT_WHITE = "\033[97m"


class ColoredFormatter(logging.Formatter):
    """Custom formatter that adds colors to log levels"""
    
    COLORS = {
        logging.DEBUG: Colors.BRIGHT_BLUE,
        logging.INFO: Colors.BRIGHT_CYAN,
        logging.WARNING: Colors.BRIGHT_YELLOW,
        logging.ERROR: Colors.BRIGHT_RED,
        logging.CRITICAL: Colors.BRIGHT_RED + Colors.BOLD,
    }
    
    LEVEL_NAMES = {
        logging.DEBUG: "DEBUG",
        logging.INFO: "INFO ",
        logging.WARNING: "WARN ",
        logging.ERROR: "ERROR",
        logging.CRITICAL: "CRITICAL",
    }
    
    def format(self, record: logging.LogRecord) -> str:
        # Get color for this log level
        color = self.COLORS.get(record.levelno, Colors.RESET)
        level_name = self.LEVEL_NAMES.get(record.levelno, record.levelname)
        
        # Format the message
        log_message = super().format(record)
        
        # Add colors
        if sys.stdout.isatty():  # Only add colors if output is a terminal
            # Color the level name
            colored_level = f"{color}{level_name}{Colors.RESET}"
            # Replace the level name in the formatted message
            log_message = log_message.replace(level_name, colored_level, 1)
            # Color the logger name
            if hasattr(record, 'name'):
                log_message = log_message.replace(
                    record.name, 
                    f"{Colors.BRIGHT_MAGENTA}{record.name}{Colors.RESET}",
                    1
                )
        
        return log_message


def setup_logging(level: int = logging.INFO) -> None:
    """Setup logging configuration with colored output"""
    
    # Create formatter
    formatter = ColoredFormatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    
    # Setup root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    
    # Remove existing handlers
    root_logger.handlers.clear()
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_handler.setFormatter(formatter)
    
    # Add handler to root logger
    root_logger.addHandler(console_handler)
    
    # Set levels for specific loggers
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)  # Reduce access log noise
    logging.getLogger("fastapi").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)  # Reduce SQL query noise
    
    # Log the setup
    logger = logging.getLogger(__name__)
    logger.info(f"Logging configured at level: {logging.getLevelName(level)}")


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with the given name"""
    return logging.getLogger(name)

