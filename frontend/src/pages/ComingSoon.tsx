interface ComingSoonProps {
    title: string;
    description?: string;
  }
  
  function ComingSoon({ title, description }: ComingSoonProps) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-2 text-slate-900">{title}</h1>
        <p className="text-slate-500 mb-6">
          {description || "Ova sekcija je u pripremi."}
        </p>
  
        <div className="bg-white rounded-lg p-10 text-center text-slate-400 border border-dashed border-slate-300">
          <p className="text-sm">Uskoro dostupno.</p>
        </div>
      </div>
    );
  }
  
  export default ComingSoon;
  