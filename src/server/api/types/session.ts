interface Session {
  user: {
    id: string;
    name: string;
    email: string;
    userType: UserType;
    username: string;
    primaryCampusId?: string | null;
  };
  expires: string;
}