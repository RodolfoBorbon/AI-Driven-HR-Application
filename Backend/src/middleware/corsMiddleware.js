import cors from "cors";

const corsOptions = {
  origin: ["http://localhost:3000", "http://localhost:5001"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};

export default cors(corsOptions);
