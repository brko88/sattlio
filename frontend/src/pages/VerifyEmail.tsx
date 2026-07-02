import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Token nije pronađen u linku.");
      return;
    }

    api
      .post("/api/v1/auth/verify-email", { token })
      .then(() => {
        setStatus("success");
        setMessage("Email adresa je uspješno potvrđena!");
        setTimeout(() => navigate("/login"), 3000);
      })
      .catch((err: any) => {
        setStatus("error");
        setMessage(
          err.response?.data?.detail || "Verifikacija nije uspjela. Link je možda istekao."
        );
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-sm p-10 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">
          Verifikacija email adrese
        </h1>

        {status === "loading" && (
          <p className="text-slate-500">Provjeravamo vaš link...</p>
        )}

        {status === "success" && (
          <>
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <p className="text-green-600 font-medium mb-2">{message}</p>
            <p className="text-slate-400 text-sm">
              Preusmjeravamo vas na prijavu za 3 sekunde...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-red-500 text-5xl mb-4">✗</div>
            <p className="text-red-600 font-medium mb-4">{message}</p>
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Idi na prijavu
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
