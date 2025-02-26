# AI Co-Scientist Platform

An advanced research assistant that utilizes AI agents to generate novel research directions and analyze scientific literature. This platform combines CrewAI with literature search tools to help researchers explore new ideas and hypotheses.

## Features

- **Multi-Agent System**: Uses specialized AI agents for generation and reflection of research ideas
- **Literature Search**: Searches academic sources like arXiv to support research directions
- **Real-time Progress Tracking**: Monitor the research process with detailed agent logs
- **API Flexibility**: Works with or without SerpAPI (uses arXiv as fallback)
- **Modern UI**: React-based interface for better user experience

## Project Structure

```
ai-co-scientist/
├── backend/
│   ├── api/
│   │   └── index.py         # Vercel serverless function handler
│   ├── app.py               # Main backend application
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.js           # Main React component
│   │   └── index.js         # React entry point
│   ├── .env.development     # Local development config
│   ├── .env.production      # Production config
│   └── package.json         # NPM dependencies & scripts
├── .gitignore               # Git ignore patterns
├── DEPLOY.md                # Deployment instructions
├── README.md                # Project documentation
└── vercel.json              # Vercel configuration
```

## Local Development Setup

### Backend Setup

1. Create a virtual environment and activate it:

```bash
cd backend
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the Flask backend:

```bash
python app.py
```

The backend will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## API Keys

To use the platform, you'll need:

1. **OpenAI API Key** (required): Get from [OpenAI Platform](https://platform.openai.com)
2. **SerpAPI Key** (optional): Get from [SerpAPI](https://serpapi.com)

Without a SerpAPI key, the platform will use arXiv as the primary research source.

## Deployment

Instructions for deploying to Vercel are included in the project documentation.

## License

MIT
