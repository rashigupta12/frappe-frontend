import LoginForm from "../form/LoginForm";


function LoginPage() {
  return (
    <div className="flex items-center">
      <div className="flex-grow bg-gradient-to-r from-emerald-500 to-blue-500">
        <LoginForm />
      </div>
    </div>
  );
}

export default LoginPage;
