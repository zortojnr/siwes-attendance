// Student ID regex fix (line ~195)
const studentIdPattern = /^FCP\/CSS\/20\/\d{4}$/; 
// ✅ Accepts any 4 digits, e.g., FCP/CSS/20/5678

// Admin Login — ensure valid email & lowercase
const handleAdminLogin = async () => {
  setLoading(true);
  try {
    const email = adminEmail.trim().toLowerCase(); // ✅ ensure proper format
    const password = adminPassword.trim();

    let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: 'System',
            last_name: 'Administrator',
            role: 'admin'
          }
        }
      });

      if (signUpError) throw signUpError;

      if (signUpData.user) {
        await supabase.from('profiles').upsert({
          user_id: signUpData.user.id,
          first_name: 'System',
          last_name: 'Administrator',
          role: 'admin'
        });

        await supabase.from('user_roles').upsert({
          user_id: signUpData.user.id,
          role: 'admin'
        });

        const { error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (retryError) throw retryError;
      }
    }

    toast({
      title: "Welcome Admin!",
      description: "Successfully logged in."
    });
  } catch (error: any) {
    console.error('Admin login error:', error);
    toast({
      title: "Login Failed",
      description: error.message || "Please check your Supabase auth settings.",
      variant: "destructive"
    });
  } finally {
    setLoading(false);
  }
};

// Guest Login — graceful fallback if disabled
const handleGuestLogin = async () => {
  setLoading(true);
  try {
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      if (error.message.includes("disabled")) {
        toast({
          title: "Guest Login Disabled",
          description: "Anonymous sign-ins are disabled in your Supabase settings. Enable them in Authentication → Providers → Anonymous.",
          variant: "destructive"
        });
      } else throw error;
      return;
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        user_id: data.user.id,
        first_name: 'Guest',
        last_name: 'User',
        role: 'guest'
      });

      await supabase.from('user_roles').upsert({
        user_id: data.user.id,
        role: 'guest'
      });

      toast({
        title: "Welcome Guest!",
        description: "You're logged in as a guest."
      });
    }
  } catch (error: any) {
    console.error('Guest login error:', error);
    toast({
      title: "Login Failed",
      description: error.message,
      variant: "destructive"
    });
  } finally {
    setLoading(false);
  }
};
