import { useNavigate } from "react-router-dom";

function Onboarding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">
          Dobrodošli na Sattlio!
        </h1>
        <p className="text-slate-500 text-center mb-8">
          Kako želite koristiti platformu?
        </p>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate("/book")}
            className="bg-white rounded-lg p-6 shadow-sm border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all text-left"
          >
            <p className="font-semibold text-slate-900 mb-1">📅 Želim rezervisati termin</p>
            <p className="text-sm text-slate-500">
              Pronađite salon i rezervišite termin online.
            </p>
          </button>

          <button
            onClick={() => navigate("/create-tenant")}
            className="bg-white rounded-lg p-6 shadow-sm border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all text-left"
          >
            <p className="font-semibold text-slate-900 mb-1">💼 Upravljam salonom</p>
            <p className="text-sm text-slate-500">
              Registrujte vaš salon i počnite upravljati rezervacijama.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
