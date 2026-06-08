
// import { AuthForm } from "@/components/auth/AuthForm";
// import { Link } from "react-router-dom";

// const Auth = () => {
//   return (
//     <div className="min-h-screen bg-black/95 flex items-center justify-center p-4">
//       <div className="w-full max-w-md bg-background rounded-lg p-8">
//         <div className="flex justify-center mb-8">
//           <Link 
//             to="/" 
//             className="transition-transform duration-300 hover:scale-105"
//           >
//             {/* <img 
//               src="/lovable-uploads/09c826bc-fcac-4dcc-8cb0-8005d2a77b8e.png" 
//               alt="NOTES Logo" 
//               className="h-8 w-auto"
//             /> */}
//           </Link>
//         </div>
//         <AuthForm />
//       </div>
//     </div>
//   );
// };

// export default Auth;



import { AuthForm } from "@/components/auth/AuthForm";
import { Link } from "react-router-dom";

const Auth = () => {
  return (
    <AuthForm />
  );
};

export default Auth;