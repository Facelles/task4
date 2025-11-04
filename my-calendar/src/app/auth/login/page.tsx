"use client";

import { useState } from "react";
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Stack,
} from "@mui/material";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/firebase/config";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleAuth = async () => {
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box mt={10}>
        <Typography variant="h5" textAlign="center" gutterBottom>
          {isRegister ? "Реєстрація" : "Вхід"}
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
          />
          <TextField
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
          />
          {error && <Typography color="error">{error}</Typography>}

          <Button variant="contained" onClick={handleAuth}>
            {isRegister ? "Зареєструватися" : "Увійти"}
          </Button>

          <Button variant="outlined" onClick={handleGoogleLogin}>
            Увійти через Google
          </Button>

          <Button onClick={() => setIsRegister(!isRegister)}>
            {isRegister
              ? "Вже маєш акаунт? Увійти"
              : "Немає акаунту? Зареєструйся"}
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
