import { useContext, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { api } from "../services/api";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  return (
    <>
      <h1>Bem-vindo {user?.email}</h1>
    </>
  );
}
