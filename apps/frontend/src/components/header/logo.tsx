import { useNavigate } from "react-router-dom";

export default function Logo() {
  const navigate = useNavigate();
  return (
    <div
      className="text-2xl font-bold text-green-600 hover:cursor-pointer"
      onClick={() => {
        navigate("/");
      }}
    >
      Kaleshi
    </div>
  );
}
