// frontend/src/constants/index.js
export const translations = {
  vi: {
    // Basic translations
    welcome: 'Chào mừng bạn đến với Quảng Ninh! Bạn muốn đi đâu hôm nay?',
    inputPlaceholder: 'Nhập yêu cầu của bạn...',
    error: 'Lỗi',
    connectionError: 'Không thể gửi yêu cầu.',
    languageSwitch: 'English',
    subtitle: 'Trợ lý du lịch thông minh',
    status: 'Trực tuyến',
    location: 'Quảng Ninh, Việt Nam',
    
    // Welcome screen
    welcomeTitle: 'Chào mừng đến với QBot AI!',
    welcomeSubtitle: 'Trợ lý du lịch thông minh của bạn tại Quảng Ninh',
    welcomeDescription: 'Tôi sẽ giúp bạn khám phá những điểm đến tuyệt vời, tìm kiếm nhà hàng ngon và lên kế hoạch cho chuyến du lịch hoàn hảo tại Quảng Ninh!',
    welcomeGreeting: 'Xin chào! Tôi là QBot AI, trợ lý du lịch của bạn!',
    tryButton: 'Dùng thử ngay',
    loginPrompt: 'Đăng nhập để lưu lịch sử chat và nhận gợi ý cá nhân hóa!',
    
    // Authentication
    login: 'Đăng nhập',
    signIn: 'Đăng nhập',
    signInNow: 'Đăng nhập',
    register: 'Đăng ký',
    createAccount: 'Tạo tài khoản',
    signUpNow: 'Đăng ký',
    loginNow: 'Đăng nhập ngay',
    registerNow: 'Đăng ký ngay',
    loginSubtitle: 'Đăng nhập vào tài khoản của bạn',
    registerSubtitle: 'Tạo một tài khoản mới',
    welcomeBack: 'Chào mừng trở lại',
    
    // Form fields
    email: 'Email',
    password: 'Mật khẩu',
    name: 'Họ tên',
    confirmPassword: 'Xác nhận mật khẩu',
    enterEmail: 'Nhập địa chỉ email',
    enterPassword: 'Nhập mật khẩu',
    enterName: 'Nhập họ tên đầy đủ',
    enterConfirmPassword: 'Nhập lại mật khẩu',
    
    // Form validation
    emailRequired: 'Email là bắt buộc',
    passwordRequired: 'Mật khẩu là bắt buộc',
    nameRequired: 'Họ tên là bắt buộc',
    confirmPasswordRequired: 'Vui lòng xác nhận mật khẩu',
    invalidEmail: 'Định dạng email không hợp lệ',
    passwordTooShort: 'Mật khẩu phải có ít nhất 6 ký tự',
    passwordMismatch: 'Mật khẩu không khớp',
    
    // Social login
    loginWithGoogle: 'Google',
    loginWithFacebook: 'Facebook',
    //orLoginWith: 'Hoặc đăng nhập bằng',
    orUseEmail: 'hoặc sử dụng email',
    socialLoginNotConfigured: 'Đăng nhập xã hội chưa được cấu hình',
    contactAdmin: 'Vui lòng liên hệ quản trị viên',
    switchLanguage: 'Chuyển ngôn ngữ',
    
    // Loading states
    signingIn: 'Đang đăng nhập...',
    signingInWithGoogle: 'Đang đăng nhập với Google...',
    signingInWithFacebook: 'Đang đăng nhập với Facebook...',
    creatingAccount: 'Đang tạo tài khoản...',
    authenticating: 'Đang xác thực...',
    
    // Success messages
    loginSuccess: 'Đăng nhập thành công!',
    registerSuccess: 'Đăng ký thành công!',
    googleLoginSuccess: 'Đăng nhập Google thành công!',
    facebookLoginSuccess: 'Đăng nhập Facebook thành công!',
    welcomeMessage: 'Chào mừng đến với nền tảng của chúng tôi!',
    
    // Error messages
    loginError: 'Đăng nhập thất bại',
    registerError: 'Đăng ký thất bại',
    socialLoginError: 'Đăng nhập xã hội thất bại',
    
    // Account status
    noAccount: 'Chưa có tài khoản?',
    hasAccount: 'Đã có tài khoản?',
    welcome: 'Chào mừng',
    logout: 'Đăng xuất',
    
    // Chat interface
    voiceAssistant:"Chế độ thoại",
    addExtension: "Thêm tiện ích",
    sendMessage: 'Gửi tin nhắn',
    thinking: 'Đang suy nghĩ...',
    copyMessage: 'Sao chép tin nhắn',
    playAudio: 'Phát âm thanh',
    apiDisabled: 'Chức năng API đã bị vô hiệu hóa. Đây là phản hồi demo.',
    
    // Theme
    darkMode: 'Chế độ tối',
    lightMode: 'Chế độ sáng',
    toggleTheme: 'Chuyển đổi chủ đề',
    
    // Empty state
    welcomeToChat: 'Chào mừng đến với QBot',
    chatDescription: 'Tôi là trợ lý du lịch thông minh của bạn. Hãy bắt đầu cuộc trò chuyện bằng cách gửi tin nhắn!',
    suggestions: 'Gợi ý:',
    askQuestion: 'Đặt câu hỏi',
    askQuestionDesc: 'Hỏi bất cứ điều gì bạn muốn biết',
    getIdeas: 'Lấy ý tưởng',
    getIdeasDesc: 'Brainstorm và sáng tạo cùng AI',
    helpCoding: 'Hỗ trợ lập trình',
    helpCodingDesc: 'Giải quyết vấn đề code',
    translate: 'Dịch thuật',
    translateDesc: 'Dịch văn bản sang nhiều ngôn ngữ',
  },
  
  en: {
    // Basic translations
    welcome: 'Welcome to Quang Ninh! Where would you like to go today?',
    inputPlaceholder: 'Enter your request...',
    error: 'Error',
    connectionError: 'Could not send request.',
    languageSwitch: 'Tiếng Việt',
    subtitle: 'Smart Travel Assistant',
    status: 'Online',
    location: 'Quang Ninh, Vietnam',
    
    // Welcome screen
    welcomeTitle: 'Welcome to QBot AI!',
    welcomeSubtitle: 'Your Smart Travel Assistant in Quang Ninh',
    welcomeDescription: 'I will help you discover amazing destinations, find great restaurants, and plan your perfect trip in Quang Ninh!',
    welcomeGreeting: 'Hello! I am QBot AI, your travel assistant!',
    tryButton: 'Try Now',
    loginPrompt: 'Sign in to save your chat history and get personalized recommendations!',
    
    // Authentication
    login: 'Sign In',
    signIn: 'Sign In',
    signInNow: 'Sign in',
    register: 'Sign Up',
    createAccount: 'Create Account',
    signUpNow: 'Sign up',
    loginNow: 'Sign in now',
    registerNow: 'Sign up now',
    loginSubtitle: 'Sign in to your account',
    registerSubtitle: 'Create a new account',
    welcomeBack: 'Welcome Back',
    
    // Form fields
    email: 'Email',
    password: 'Password',
    name: 'Full Name',
    confirmPassword: 'Confirm Password',
    enterEmail: 'Enter your email address',
    enterPassword: 'Enter your password',
    enterName: 'Enter your full name',
    enterConfirmPassword: 'Re-enter your password',
    
    // Form validation
    emailRequired: 'Email is required',
    passwordRequired: 'Password is required',
    nameRequired: 'Name is required',
    confirmPasswordRequired: 'Please confirm your password',
    invalidEmail: 'Invalid email format',
    passwordTooShort: 'Password must be at least 6 characters',
    passwordMismatch: 'Passwords do not match',
    
    // Social login
    loginWithGoogle: 'Google',
    loginWithFacebook: 'Facebook',
    //orLoginWith: 'Or sign in with',
    orUseEmail: 'or use email',
    socialLoginNotConfigured: 'Social login not configured',
    contactAdmin: 'Please contact administrator',
    switchLanguage: 'Switch Language',
    
    // Loading states
    signingIn: 'Signing in...',
    signingInWithGoogle: 'Signing in with Google...',
    signingInWithFacebook: 'Signing in with Facebook...',
    creatingAccount: 'Creating account...',
    authenticating: 'Authenticating...',
    
    // Success messages
    loginSuccess: 'Login successful!',
    registerSuccess: 'Registration successful!',
    googleLoginSuccess: 'Signed in with Google successfully!',
    facebookLoginSuccess: 'Signed in with Facebook successfully!',
    welcomeMessage: 'Welcome to our platform!',
    
    // Error messages
    loginError: 'Login failed',
    registerError: 'Registration failed',
    socialLoginError: 'Social login failed',
    
    // Account status
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    welcome: 'Welcome',
    logout: 'Sign Out',
    
    // Chat interface
    voiceAssistant: "Voice mode",
    addExtension: "Add an extension",
    sendMessage: 'Send message',
    thinking: 'Thinking...',
    copyMessage: 'Copy message',
    playAudio: 'Play audio',
    apiDisabled: 'API functionality has been disabled. This is a demo response.',
    
    // Theme
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    toggleTheme: 'Toggle Theme',
    
    // Empty state
    welcomeToChat: 'Welcome to QBot',
    chatDescription: 'I am your smart travel assistant. Start a conversation by sending a message!',
    suggestions: 'Suggestions:',
    askQuestion: 'Ask a question',
    askQuestionDesc: 'Ask anything you want to know',
    getIdeas: 'Get ideas',
    getIdeasDesc: 'Brainstorm and create with AI',
    helpCoding: 'Help with coding',
    helpCodingDesc: 'Solve coding problems',
    translate: 'Translate',
    translateDesc: 'Translate text to multiple languages',
  },
};

export const chatbotConfig = {
  name: 'QBot',
  logo: "🤖",
  theme: {
    primary: 'blue',
    secondary: 'teal',
    accent: 'purple',
  },
  features: {
    showStatus: false,
    showLocation: true,
    showSubtitle: true,
    showLogo: true,
    animated: true,
    voiceEnabled: true,
    socialLogin: true,
    chatHistory: true,
  },
  customStyles: {
    headerBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    headerHeight: { base: '100px', md: '120px' },
    logoSize: { base: '40px', md: '50px' },
  },
  /*oauth: {
    google: {
      enabled: !!environment.GOOGLE_CLIENT_ID,
      clientId: environment.GOOGLE_CLIENT_ID,
    },
    facebook: {
      enabled: !!environment.FACEBOOK_APP_ID,
      appId: environment.FACEBOOK_APP_ID,
    },
  },*/
};