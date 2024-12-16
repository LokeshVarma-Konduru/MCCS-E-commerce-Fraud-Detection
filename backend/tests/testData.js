export const users = [
    {
      _id: "675fa2fd58089aa77e9408d0",
      email: "loki1432varma@gmail.com",
      password: "$2a$10$SvWGfDog9NdfyYp5dQqt1usalXjmtv0gXtNW75cPSxNDQn3uuEh6q", // Loki@1234
      name: "Lokesh",
      role: "Admin",
      status: true,
      otp: "123456", // OTP for testing
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    },
    {
      _id: "675fa5bbb727d03a130a9af6",
      email: "k.lokeshvarma26@gmail.com",
      password: "$2b$10$iulj.ZTeOsxh8LbwmAa5Mu45J7M7S/fFnH/xOfhmITTz9y7APTsQO", // 941d1349
      name: "Lokesh Varma Konduru",
      role: "Developer",
      status: true,
      otp: null, // No OTP
      otpExpiresAt: null,
    },
  ];
  