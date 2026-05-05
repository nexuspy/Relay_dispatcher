import logging
import sys
import json
from datetime import datetime

class StructuredLogger:
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)
        
        # Standard output handler
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter('%(message)s'))
        self.logger.addHandler(handler)

    def _log(self, level: str, msg: str, **kwargs):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": level,
            "module": self.logger.name,
            "message": msg,
            **kwargs
        }
        self.logger.info(json.dumps(log_entry))

    def info(self, msg: str, **kwargs):
        self._log("INFO", msg, **kwargs)

    def error(self, msg: str, **kwargs):
        self._log("ERROR", msg, **kwargs)

    def warning(self, msg: str, **kwargs):
        self._log("WARNING", msg, **kwargs)

logger = StructuredLogger("relay")
