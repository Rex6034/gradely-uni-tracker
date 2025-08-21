
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Stethoscope, Pill, User, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const userTypes = [
    {
      id: "supplier",
      title: "Medicine Supplier",
      icon: Building2,
      description: "Pharmaceutical companies and distributors",
      color: "bg-gradient-to-br from-blue-600 to-blue-700",
      hoverColor: "hover:from-blue-700 hover:to-blue-800"
    },
    {
      id: "pharmacy",
      title: "Pharmacy",
      icon: Pill,
      description: "Licensed pharmacies and drugstores",
      color: "bg-gradient-to-br from-teal-600 to-teal-700",
      hoverColor: "hover:from-teal-700 hover:to-teal-800"
    }
    // {
    //   id: "doctor",
    //   title: "Doctor",
    //   icon: Stethoscope,
    //   description: "Medical practitioners and healthcare providers",
    //   color: "bg-gradient-to-br from-emerald-600 to-emerald-700",
    //   hoverColor: "hover:from-emerald-700 hover:to-emerald-800"
    // },
    // {
    //   id: "customer",
    //   title: "Customer",
    //   icon: User,
    //   description: "Patients and general consumers",
    //   color: "bg-gradient-to-br from-cyan-600 to-cyan-700",
    //   hoverColor: "hover:from-cyan-700 hover:to-cyan-800"
    // }
  ];

  const handleLogin = (userType: string) => {
    navigate(`/login/${userType}`);
  };

  const handleSignup = (userType: string) => {
    navigate(`/signup/${userType}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-teal-800 text-white py-6 shadow-xl">
        <div className="container mx-auto px-6">
          <div className="flex items-center space-x-4">
            <div className="bg-white p-2 rounded-lg">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Easypharma</h1>
          </div>
          <p className="mt-2 text-blue-100 text-lg">Your trusted pharmaceutical platform</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Choose Your Access Portal
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select your role to access the appropriate features and services tailored for your needs
          </p>
        </div>

        <div className="flex justify-center gap-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {userTypes.map((userType) => {
            const Icon = userType.icon;
            return (
              <Card 
                key={userType.id} 
                className="group hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden transform hover:-translate-y-2"
              >
                <CardContent className="p-0">
                  <div className={`${userType.color} ${userType.hoverColor} text-white p-8 transition-all duration-300`}>
                    <div className="text-center mb-6">
                      <div className="bg-white/20 p-4 rounded-full inline-block mb-4 group-hover:bg-white/30 transition-colors duration-300">
                        <Icon className="h-12 w-12" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{userType.title}</h3>
                      <p className="text-sm opacity-90">{userType.description}</p>
                    </div>
                    
                    <div className="space-y-3">
                      <Button 
                        onClick={() => handleLogin(userType.id)}
                        className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/50 transition-all duration-200"
                        variant="outline"
                      >
                        Login
                      </Button>
                      <Button 
                        onClick={() => handleSignup(userType.id)}
                        className="w-full bg-white text-gray-800 hover:bg-gray-100 transition-all duration-200 font-semibold"
                      >
                        Sign Up
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Why Choose Easypharma?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="p-6">
              <div className="bg-blue-100 p-3 rounded-full inline-block mb-4">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Secure Platform</h4>
              <p className="text-gray-600">HIPAA compliant and secure authentication for all user types</p>
            </div>
            <div className="p-6">
              <div className="bg-teal-100 p-3 rounded-full inline-block mb-4">
                <Stethoscope className="h-6 w-6 text-teal-600" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Healthcare Focused</h4>
              <p className="text-gray-600">Built specifically for pharmaceutical and healthcare workflows</p>
            </div>
            <div className="p-6">
              <div className="bg-emerald-100 p-3 rounded-full inline-block mb-4">
                <Pill className="h-6 w-6 text-emerald-600" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Easy Integration</h4>
              <p className="text-gray-600">Seamless integration with existing pharmacy and medical systems</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2024 Easypharma. All rights reserved.</p>
          <p className="text-sm text-gray-400 mt-2">Secure pharmaceutical platform for all stakeholders</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
