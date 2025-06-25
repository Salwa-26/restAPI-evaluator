## restAPI-evaluator

REST API Evaluator
A comprehensive web application built with the MEVN stack (MongoDB, Express.js, Vue.js, Node.js) that automatically evaluates REST APIs using OpenAPI Specifications (OAS). The application parses OAS files, discovers endpoints, and executes GET and POST requests with generated dummy data.

# 📋 Prerequisites
-	Node.js (v16.0.0 or higher)
-	MongoDB (v4.4 or higher)
-	npm 
-	Git
  
# 🛠️ Installation & Setup
# 1. Clone the Repository
````
git clone https://github.com/Salwa-26/restAPI-evaluator.git
````
# 2. Backend Setup
Navigate to backend directory
````
cd backend
````
Install dependencies
````
npm install express mongoose cors dotenv axios swagger-parser jsonschema @faker-js/faker

npm install -D nodemon
````
# 3. Frontend Setup
Navigate to frontend directory (from root)

````
cd frontend
````
Install dependencies
````
npm install axios bootstrap@5.3.0 bootstrap-vue-next
````

# 4. Database Setup
Ensure MongoDB is running on your system:
-For Windows
Start MongoDB service from command line

# 🚀 Running the Application
Run both services separately
# Terminal 1 - Backend
````
cd backend
npm run dev
````
# Terminal 2 - Frontend
````
cd frontend
npm run dev
````

The application will be available at:
````
http://localhost:3000
````

# 🔧 Usage
Basic Usage
# 1.	Start New Evaluation:
-	Enter an OpenAPI Specification URL
-	Suggested test URLs:
-	Petstore API: https://petstore.swagger.io/v2/swagger.json
- Click "Start Evaluation"

# 2.	Viewing Progress:
-	View status updates
-	See success/failure rates

# 3.	Review Results:
- Detailed summary report with success rates
- Complete request/response logs
- Export results as JSON

