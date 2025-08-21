
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Stethoscope, Pill, User, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Signup = () => {
  const { userType } = useParams<{ userType: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    // User type specific fields
    companyName: "",
    licenseNumber: "",
    specialization: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    agreesToTerms: false
  });

  const userTypeConfig = {
    supplier: {
      title: "Medicine Supplier Registration",
      icon: Building2,
      color: "from-blue-600 to-blue-700",
      description: "Join our network of trusted suppliers"
    },
    pharmacy: {
      title: "Pharmacy Registration",
      icon: Pill,
      color: "from-teal-600 to-teal-700",
      description: "Register your pharmacy with us"
    }
    // Commented out - not needed for this project
    // doctor: {
    //   title: "Doctor Registration",
    //   icon: Stethoscope,
    //   color: "from-emerald-600 to-emerald-700",
    //   description: "Join our healthcare provider network"
    // },
    // customer: {
    //   title: "Customer Registration",
    //   icon: User,
    //   color: "from-cyan-600 to-cyan-700",
    //   description: "Create your patient account"
    // }
  };

  const config = userTypeConfig[userType as keyof typeof userTypeConfig];
  const Icon = config?.icon || User;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.agreesToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and conditions to continue.",
        variant: "destructive"
      });
      return;
    }

    // Simulate registration process
    toast({
      title: "Registration Successful",
      description: `Welcome to Easypharma! Your ${userType} account has been created.`,
    });

    // Simulate API call delay
    setTimeout(() => {
      navigate(`/dashboard/${userType}`);
    }, 1500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Invalid User Type</h2>
            <Button onClick={() => navigate("/")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderUserTypeSpecificFields = () => {
    switch (userType) {
      case 'supplier':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                name="companyName"
                placeholder="Enter company name"
                value={formData.companyName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number *</Label>
              <Input
                id="licenseNumber"
                name="licenseNumber"
                placeholder="Enter license number"
                value={formData.licenseNumber}
                onChange={handleInputChange}
                required
              />
            </div>
          </>
        );
      case 'pharmacy':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="companyName">Pharmacy Name *</Label>
              <Input
                id="companyName"
                name="companyName"
                placeholder="Enter pharmacy name"
                value={formData.companyName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">Pharmacy License *</Label>
              <Input
                id="licenseNumber"
                name="licenseNumber"
                placeholder="Enter pharmacy license number"
                value={formData.licenseNumber}
                onChange={handleInputChange}
                required
              />
            </div>
          </>
        );
      // Commented out - not needed for this project
      // case 'doctor':
      //   return (
      //     <>
      //       <div className="space-y-2">
      //         <Label htmlFor="licenseNumber">Medical License *</Label>
      //         <Input
      //           id="licenseNumber"
      //           name="licenseNumber"
      //           placeholder="Enter medical license number"
      //           value={formData.licenseNumber}
      //           onChange={handleInputChange}
      //           required
      //         />
      //       </div>
      //       <div className="space-y-2">
      //         <Label htmlFor="specialization">Specialization *</Label>
      //         <Select onValueChange={(value) => handleSelectChange('specialization', value)}>
      //           <SelectTrigger>
      //             <SelectValue placeholder="Select specialization" />
      //           </SelectTrigger>
      //           <SelectContent>
      //             <SelectItem value="general">General Medicine</SelectItem>
      //             <SelectItem value="cardiology">Cardiology</SelectItem>
      //             <SelectItem value="dermatology">Dermatology</SelectItem>
      //             <SelectItem value="endocrinology">Endocrinology</SelectItem>
      //             <SelectItem value="gastroenterology">Gastroenterology</SelectItem>
      //             <SelectItem value="neurology">Neurology</SelectItem>
      //             <SelectItem value="oncology">Oncology</SelectItem>
      //             <SelectItem value="pediatrics">Pediatrics</SelectItem>
      //             <SelectItem value="psychiatry">Psychiatry</SelectItem>
      //             <SelectItem value="other">Other</SelectItem>
      //           </SelectContent>
      //         </Select>
      //       </div>
      //     </>
      //   );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Button 
          onClick={() => navigate("/")} 
          variant="ghost" 
          className="mb-6 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card className="shadow-2xl border-0">
          <CardHeader className={`bg-gradient-to-r ${config.color} text-white p-8 rounded-t-lg`}>
            <div className="text-center">
              <div className="bg-white/20 p-4 rounded-full inline-block mb-4">
                <Icon className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-bold">{config.title}</CardTitle>
              <p className="text-sm opacity-90 mt-2">{config.description}</p>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* User Type Specific Fields */}
              {renderUserTypeSpecificFields()}

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Address Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Textarea
                    id="address"
                    name="address"
                    placeholder="Enter street address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="Enter city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      placeholder="Enter state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code *</Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      placeholder="Enter ZIP code"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      className="pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-2">
                <input
                  id="terms"
                  name="agreesToTerms"
                  type="checkbox"
                  checked={formData.agreesToTerms}
                  onChange={handleInputChange}
                  className="mt-1 rounded border-gray-300"
                  required
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed">
                  I agree to the{" "}
                  <Button variant="link" className="p-0 h-auto text-sm">
                    Terms and Conditions
                  </Button>{" "}
                  and{" "}
                  <Button variant="link" className="p-0 h-auto text-sm">
                    Privacy Policy
                  </Button>
                </Label>
              </div>

              <Button 
                type="submit" 
                className={`w-full h-12 bg-gradient-to-r ${config.color} hover:opacity-90 transition-opacity`}
              >
                Create Account
              </Button>

              <div className="text-center">
                <span className="text-sm text-gray-600">Already have an account? </span>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm"
                  onClick={() => navigate(`/login/${userType}`)}
                >
                  Sign in here
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
