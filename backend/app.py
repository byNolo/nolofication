"""Main application entry point."""
import os
from app import create_app

app = create_app(os.getenv('FLASK_ENV', 'development'))

if __name__ == '__main__':
    app.run(
        host=app.config['HOST'],
        port=app.config['PORT'],
        debug=app.config['DEBUG']
    )
