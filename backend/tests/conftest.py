import os

# Tests use a separate database. This must run before the app is imported.
os.environ["DATABASE_URL"] = "postgresql+psycopg://localhost/ordo_test"
