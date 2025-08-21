
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Stethoscope, Pill, User, LogOut, Settings, Bell, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { userType } = useParams<{ userType: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const userTypeConfig = {
    supplier: {
      title: "Supplier Dashboard",
      icon: Building2,
      color: "from-blue-600 to-blue-700",
      welcomeMessage: "Welcome to your Supplier Dashboard",
      features: [
        "Manage Product Catalog",
        "View Orders",
        "Inventory Management",
        "Sales Analytics",
        "Customer Management"
      ]
    },
    pharmacy: {
      title: "Pharmacy Dashboard",
      icon: Pill,
      color: "from-teal-600 to-teal-700",
      welcomeMessage: "Welcome to your Pharmacy Dashboard",
      features: [
        "POS System",
        "Prescription Management", 
        "Inventory Tracking",
        "Customer Orders",
        "Sales Reports",
        "Supplier Network"
      ]
    },
    doctor: {
      title: "Doctor Dashboard",
      icon: Stethoscope,
      color: "from-emerald-600 to-emerald-700",
      welcomeMessage: "Welcome to your Medical Dashboard",
      features: [
        "Patient Records",
        "Prescription Writing",
        "Appointment Scheduling",
        "Medical History",
        "Consultation Notes"
      ]
    },
    customer: {
      title: "Customer Dashboard",
      icon: User,
      color: "from-cyan-600 to-cyan-700",
      welcomeMessage: "Welcome to your Patient Portal",
      features: [
        "My Prescriptions",
        "Order History",
        "Find Pharmacies",
        "Health Records",
        "Medication Reminders"
      ]
    }
  };

  const config = userTypeConfig[userType as keyof typeof userTypeConfig];
  const Icon = config?.icon || User;

  const handleLogout = () => {
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Invalid User Type</h2>
            <Button onClick={() => navigate("/")} variant="outline">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <header className={`bg-gradient-to-r ${config.color} text-white shadow-lg`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Icon className="h-8 w-8" />
              <h1 className="text-2xl font-bold">{config.title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                onClick={handleLogout}
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{config.welcomeMessage}</h2>
          <p className="text-gray-600">Manage your account and access all features from this dashboard.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">24</div>
                <div className="text-sm text-gray-600">Active Items</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">12</div>
                <div className="text-sm text-gray-600">Pending Orders</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">5</div>
                <div className="text-sm text-gray-600">Notifications</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">98%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {config.features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">{feature}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Access and manage your {feature.toLowerCase()} efficiently.
                </p>
                <Button 
                  className={`w-full bg-gradient-to-r ${config.color} hover:opacity-90`}
                  onClick={() => {
                    if (feature === "POS System" && userType === "pharmacy") {
                      navigate("/pos");
                    } else {
                      toast({
                        title: "Feature Coming Soon",
                        description: `${feature} functionality will be available soon!`,
                      });
                    }
                  }}
                >
                  Open {feature}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">New order received</p>
                    <p className="text-sm text-gray-600">2 hours ago</p>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Profile updated successfully</p>
                    <p className="text-sm text-gray-600">1 day ago</p>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">System maintenance completed</p>
                    <p className="text-sm text-gray-600">3 days ago</p>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
