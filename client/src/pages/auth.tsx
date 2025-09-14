import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { Eye, EyeOff, Sun, Moon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { initiateGoogleAuth } from "@/lib/auth";

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, "Введите email или никнейм"),
  password: z.string().min(1, "Введите пароль"),
});

const baseRegisterSchema = z.object({
  email: z.string().email("Некорректный email"),
  username: z.string().min(2, "Никнейм должен содержать минимум 2 символа"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, "Необходимо согласиться с условиями"),
});

const registerSchema = baseRegisterSchema.refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

const invitationLoginSchema = loginSchema.extend({
  invitationCode: z.string().min(1, "Введите код приглашения"),
});

const invitationRegisterSchema = baseRegisterSchema.extend({
  invitationCode: z.string().min(1, "Введите код приглашения"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const { user, login, register, invitationLogin, invitationRegister } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [invitationSubTab, setInvitationSubTab] = useState<"existing" | "new">("existing");

  if (user) {
    setLocation("/dashboard");
    return null;
  }

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const invitationLoginForm = useForm({
    resolver: zodResolver(invitationLoginSchema),
    defaultValues: {
      emailOrUsername: "",
      password: "",
      invitationCode: "",
    },
  });

  const invitationRegisterForm = useForm({
    resolver: zodResolver(invitationRegisterSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      invitationCode: "",
      acceptTerms: false,
    },
  });

  const handleLogin = async (data: z.infer<typeof loginSchema>) => {
    try {
      await login(data);
      toast({
        title: "Добро пожаловать!",
        description: "Вы успешно вошли в систему",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка входа",
        description: error.message || "Проверьте правильность данных",
        variant: "destructive",
      });
    }
  };

  const handleRegister = async (data: z.infer<typeof registerSchema>) => {
    try {
      await register(data);
      toast({
        title: "Регистрация успешна!",
        description: "Добро пожаловать в Endlessalbum",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка регистрации",
        description: error.message || "Попробуйте еще раз",
        variant: "destructive",
      });
    }
  };

  const handleInvitationLogin = async (data: z.infer<typeof invitationLoginSchema>) => {
    try {
      await invitationLogin(data);
      toast({
        title: "Добро пожаловать!",
        description: "Вы успешно присоединились к аккаунту",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка входа",
        description: error.message || "Проверьте код приглашения и данные",
        variant: "destructive",
      });
    }
  };

  const handleInvitationRegister = async (data: z.infer<typeof invitationRegisterSchema>) => {
    try {
      await invitationRegister(data);
      toast({
        title: "Регистрация успешна!",
        description: "Добро пожаловать в Endlessalbum",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка регистрации",
        description: error.message || "Проверьте код приглашения",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Theme Toggle */}
      <Button 
        onClick={toggleTheme}
        variant="ghost"
        size="sm"
        className="fixed top-4 right-4 z-50 glass-morphism p-3 rounded-full transition-all duration-300 hover:scale-110"
        data-testid="button-theme-toggle"
      >
        {theme === "dark" ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </Button>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }}></div>
      </div>

      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
        {/* Brand Section */}
        <div className="glass-morphism p-8 lg:p-12 rounded-3xl text-center lg:text-left order-2 lg:order-1 animate-glass-morph">
          <div className="flex items-center justify-center lg:justify-start mb-6">
            <Logo className="w-16 h-16 mr-4" />
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Endlessalbum
            </h1>
          </div>
          
          <div className="space-y-4 text-muted-foreground">
            <h2 className="text-xl lg:text-2xl font-semibold text-foreground">Безграничные воспоминания</h2>
            <p className="text-base lg:text-lg leading-relaxed">
              Создавайте общие воспоминания, делитесь моментами и храните самые дорогие мгновения вместе. 
              Ваша личная вселенная любви и заботы.
            </p>
            <p className="text-sm">
              Приватность • Безопасность • Вечность
            </p>
          </div>
        </div>

        {/* Auth Tabs */}
        <div className="order-1 lg:order-2 animate-glass-morph" style={{ animationDelay: "0.2s" }}>
          <Tabs defaultValue="login" className="w-full">
            <div className="glass-strong p-2 rounded-2xl mb-6">
              <TabsList className="grid w-full grid-cols-3 bg-transparent">
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:tab-active"
                  data-testid="tab-login"
                >
                  Вход
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="data-[state=active]:tab-active"
                  data-testid="tab-register"
                >
                  Регистрация
                </TabsTrigger>
                <TabsTrigger 
                  value="invitation"
                  className="data-[state=active]:tab-active"
                  data-testid="tab-invitation"
                >
                  Приглашение
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Login Tab */}
            <TabsContent value="login">
              <Card className="glass-strong border-0">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6 text-center">Добро пожаловать обратно</h3>
                  
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <div>
                      <Label className="block text-sm font-medium mb-2">Email или никнейм</Label>
                      <Input 
                        {...loginForm.register("emailOrUsername")}
                        className="glass-morphism border-0 focus:ring-2 focus:ring-primary"
                        placeholder="example@mail.com или nickname"
                        data-testid="input-email-username"
                      />
                      {loginForm.formState.errors.emailOrUsername && (
                        <p className="text-destructive text-sm mt-1">
                          {loginForm.formState.errors.emailOrUsername.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label className="block text-sm font-medium mb-2">Пароль</Label>
                      <div className="relative">
                        <Input 
                          {...loginForm.register("password")}
                          type={showPassword ? "text" : "password"}
                          className="glass-morphism border-0 focus:ring-2 focus:ring-primary pr-12"
                          placeholder="Введите пароль"
                          data-testid="input-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="text-destructive text-sm mt-1">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center">
                        <Checkbox className="mr-2" data-testid="checkbox-remember" />
                        <span>Запомнить меня</span>
                      </label>
                      <Button variant="link" className="text-primary p-0 h-auto" data-testid="link-forgot-password">
                        Забыли пароль?
                      </Button>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full btn-primary py-4 rounded-xl font-medium transition-all duration-300"
                      disabled={loginForm.formState.isSubmitting}
                      data-testid="button-submit-login"
                    >
                      {loginForm.formState.isSubmitting ? "Вход..." : "Войти"}
                    </Button>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-card text-muted-foreground">или</span>
                      </div>
                    </div>

                    <Button 
                      type="button"
                      variant="outline"
                      className="w-full glass-morphism py-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-3 hover:scale-[1.02] border-border"
                      onClick={initiateGoogleAuth}
                      data-testid="button-google-auth"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Войти через Google
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <Card className="glass-strong border-0">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6 text-center">Создать аккаунт</h3>
                  
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                    <div>
                      <Label className="block text-sm font-medium mb-2">Email</Label>
                      <Input 
                        {...registerForm.register("email")}
                        type="email"
                        className="glass-morphism border-0 focus:ring-2 focus:ring-primary"
                        placeholder="example@mail.com"
                        data-testid="input-register-email"
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-destructive text-sm mt-1">
                          {registerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label className="block text-sm font-medium mb-2">Никнейм</Label>
                      <Input 
                        {...registerForm.register("username")}
                        className="glass-morphism border-0 focus:ring-2 focus:ring-primary"
                        placeholder="Уникальный никнейм"
                        data-testid="input-register-username"
                      />
                      {registerForm.formState.errors.username && (
                        <p className="text-destructive text-sm mt-1">
                          {registerForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label className="block text-sm font-medium mb-2">Пароль</Label>
                      <div className="relative">
                        <Input 
                          {...registerForm.register("password")}
                          type={showPassword ? "text" : "password"}
                          className="glass-morphism border-0 focus:ring-2 focus:ring-primary pr-12"
                          placeholder="Надежный пароль"
                          data-testid="input-register-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-register-password"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      {registerForm.formState.errors.password && (
                        <p className="text-destructive text-sm mt-1">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="block text-sm font-medium mb-2">Подтверждение пароля</Label>
                      <div className="relative">
                        <Input 
                          {...registerForm.register("confirmPassword")}
                          type={showConfirmPassword ? "text" : "password"}
                          className="glass-morphism border-0 focus:ring-2 focus:ring-primary pr-12"
                          placeholder="Повторите пароль"
                          data-testid="input-confirm-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          data-testid="button-toggle-confirm-password"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="text-destructive text-sm mt-1">
                          {registerForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <FormField
                      control={registerForm.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="text-sm text-muted-foreground">
                          <div className="flex items-start">
                            <FormControl>
                              <Checkbox 
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="mt-0.5 mr-3"
                                data-testid="checkbox-accept-terms"
                              />
                            </FormControl>
                            <span>
                              Я согласен с{" "}
                              <Button variant="link" className="text-primary p-0 h-auto" data-testid="link-terms">
                                условиями использования
                              </Button>
                              {" "}и{" "}
                              <Button variant="link" className="text-primary p-0 h-auto" data-testid="link-privacy">
                                политикой конфиденциальности
                              </Button>
                            </span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full btn-primary py-4 rounded-xl font-medium transition-all duration-300"
                      disabled={registerForm.formState.isSubmitting}
                      data-testid="button-submit-register"
                    >
                      {registerForm.formState.isSubmitting ? "Регистрация..." : "Зарегистрироваться"}
                    </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Invitation Tab */}
            <TabsContent value="invitation">
              <Card className="glass-strong border-0">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6 text-center">Присоединиться по приглашению</h3>
                  
                  {/* Sub-tabs for invitation */}
                  <div className="glass-morphism p-1 rounded-xl mb-6 flex">
                    <Button
                      type="button"
                      variant="ghost"
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                        invitationSubTab === "existing" ? "tab-active" : ""
                      }`}
                      onClick={() => setInvitationSubTab("existing")}
                      data-testid="button-invitation-existing"
                    >
                      У меня есть аккаунт
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                        invitationSubTab === "new" ? "tab-active" : ""
                      }`}
                      onClick={() => setInvitationSubTab("new")}
                      data-testid="button-invitation-new"
                    >
                      У меня нет аккаунта
                    </Button>
                  </div>

                  {/* Existing Account Form */}
                  {invitationSubTab === "existing" && (
                    <form onSubmit={invitationLoginForm.handleSubmit(handleInvitationLogin)} className="space-y-4">
                      <div>
                        <Label className="block text-sm font-medium mb-2">Email или никнейм</Label>
                        <Input 
                          {...invitationLoginForm.register("emailOrUsername")}
                          className="glass-morphism border-0 focus:ring-2 focus:ring-primary"
                          placeholder="example@mail.com или nickname"
                          data-testid="input-invitation-email-username"
                        />
                        {invitationLoginForm.formState.errors.emailOrUsername && (
                          <p className="text-destructive text-sm mt-1">
                            {invitationLoginForm.formState.errors.emailOrUsername.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label className="block text-sm font-medium mb-2">Пароль</Label>
                        <div className="relative">
                          <Input 
                            {...invitationLoginForm.register("password")}
                            type={showPassword ? "text" : "password"}
                            className="glass-morphism border-0 focus:ring-2 focus:ring-primary pr-12"
                            placeholder="Введите пароль"
                            data-testid="input-invitation-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-invitation-password"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                        {invitationLoginForm.formState.errors.password && (
                          <p className="text-destructive text-sm mt-1">
                            {invitationLoginForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="block text-sm font-medium mb-2">Код приглашения</Label>
                        <Input 
                          {...invitationLoginForm.register("invitationCode")}
                          className="glass-morphism border-0 focus:ring-2 focus:ring-primary text-center font-mono"
                          placeholder="XXXX-XXXX-XXXX"
                          data-testid="input-invitation-code"
                        />
                        {invitationLoginForm.formState.errors.invitationCode && (
                          <p className="text-destructive text-sm mt-1">
                            {invitationLoginForm.formState.errors.invitationCode.message}
                          </p>
                        )}
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full btn-primary py-4 rounded-xl font-medium transition-all duration-300"
                        disabled={invitationLoginForm.formState.isSubmitting}
                        data-testid="button-submit-invitation-login"
                      >
                        {invitationLoginForm.formState.isSubmitting ? "Присоединение..." : "Присоединиться"}
                      </Button>
                    </form>
                  )}

                  {/* New Account Form */}
                  {invitationSubTab === "new" && (
                    <form onSubmit={invitationRegisterForm.handleSubmit(handleInvitationRegister)} className="space-y-4">
                      <div>
                        <Label className="block text-sm font-medium mb-2">Email</Label>
                        <Input 
                          {...invitationRegisterForm.register("email")}
                          type="email"
                          className="glass-morphism border-0 focus:ring-2 focus:ring-primary"
                          placeholder="example@mail.com"
                          data-testid="input-invitation-register-email"
                        />
                        {invitationRegisterForm.formState.errors.email && (
                          <p className="text-destructive text-sm mt-1">
                            {invitationRegisterForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label className="block text-sm font-medium mb-2">Никнейм</Label>
                        <Input 
                          {...invitationRegisterForm.register("username")}
                          className="glass-morphism border-0 focus:ring-2 focus:ring-primary"
                          placeholder="Уникальный никнейм"
                          data-testid="input-invitation-register-username"
                        />
                        {invitationRegisterForm.formState.errors.username && (
                          <p className="text-destructive text-sm mt-1">
                            {invitationRegisterForm.formState.errors.username.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label className="block text-sm font-medium mb-2">Пароль</Label>
                        <div className="relative">
                          <Input 
                            {...invitationRegisterForm.register("password")}
                            type={showPassword ? "text" : "password"}
                            className="glass-morphism border-0 focus:ring-2 focus:ring-primary pr-12"
                            placeholder="Надежный пароль"
                            data-testid="input-invitation-register-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-invitation-register-password"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                        {invitationRegisterForm.formState.errors.password && (
                          <p className="text-destructive text-sm mt-1">
                            {invitationRegisterForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="block text-sm font-medium mb-2">Подтверждение пароля</Label>
                        <div className="relative">
                          <Input 
                            {...invitationRegisterForm.register("confirmPassword")}
                            type={showConfirmPassword ? "text" : "password"}
                            className="glass-morphism border-0 focus:ring-2 focus:ring-primary pr-12"
                            placeholder="Повторите пароль"
                            data-testid="input-invitation-confirm-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            data-testid="button-toggle-invitation-confirm-password"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                        {invitationRegisterForm.formState.errors.confirmPassword && (
                          <p className="text-destructive text-sm mt-1">
                            {invitationRegisterForm.formState.errors.confirmPassword.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="block text-sm font-medium mb-2">Код приглашения</Label>
                        <Input 
                          {...invitationRegisterForm.register("invitationCode")}
                          className="glass-morphism border-0 focus:ring-2 focus:ring-primary text-center font-mono"
                          placeholder="XXXX-XXXX-XXXX"
                          data-testid="input-invitation-register-code"
                        />
                        {invitationRegisterForm.formState.errors.invitationCode && (
                          <p className="text-destructive text-sm mt-1">
                            {invitationRegisterForm.formState.errors.invitationCode.message}
                          </p>
                        )}
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full btn-primary py-4 rounded-xl font-medium transition-all duration-300"
                        disabled={invitationRegisterForm.formState.isSubmitting}
                        data-testid="button-submit-invitation-register"
                      >
                        {invitationRegisterForm.formState.isSubmitting ? "Присоединение..." : "Присоединиться"}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-xs text-muted-foreground">
        <p>
          © 2025 — 2025 Endlessalbum · Сделано с любовью ·{" "}
          <Button variant="link" className="text-muted-foreground hover:text-foreground p-0 h-auto text-xs" data-testid="link-privacy-footer">
            Политика конфиденциальности
          </Button>
          {" "}·{" "}
          <Button variant="link" className="text-muted-foreground hover:text-foreground p-0 h-auto text-xs" data-testid="link-terms-footer">
            Условия использования
          </Button>
        </p>
      </footer>
    </div>
  );
}
