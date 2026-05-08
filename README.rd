cd backend
pip install -r requirements.txt
uvicorn app:app --reload

cd frontend/frontend
npm install
npm run dev