function validate() {

    // Input feilds
    const name = document.getElementById('name')
    const email = document.getElementById('email')
    const password = document.getElementById('password')
    const mobile = document.getElementById('mobile')
    const confirmPassword=document.getElementById('confirmPassword')
    
    // Error feilds
    const nameError = document.getElementById('nameError')
    const emailError = document.getElementById('emailError')
    const passwordError = document.getElementById('passwordError')
    const mobileError = document.getElementById('mobileError');
    const confirmPasswordError=document.getElementById('confirmPasswordError')
    
    // Regex   
    
    const emailRegex = /^[a-z0-9._%+-]+@gmail+\.[a-z]{3}$/;
    const mobileRegex = /^[0-9]{10}$/;
    
    
    //name feild
    if (name.value.trim() === '') {
    nameError.innerHTML = 'Name cannot be Empty'
    setTimeout(() => {
       nameError.innerHTML = ''
    }, 5000)
    return false;
    }


     // email feild   
     if (email.value.trim() === '') {
        emailError.innerHTML = 'Email cannot be Empty'
        setTimeout(() => {
           emailError.innerHTML = ''
        }, 5000)
        return false;
        }
        if (!emailRegex.test(email.value)) {
        emailError.innerHTML = "Please enter a valid email"
        setTimeout(() => {
           emailError.innerHTML = ''
        }, 5000);
        return false;
        }
    
    
    //mobile feild
    if (mobile.value.trim() === '') {
    mobileError.innerHTML = 'Mobile Number cannot be Empty'
    setTimeout(() => {
       mobileError.innerHTML = ''
    }, 5000)
    return false;
    }
    
    if(!mobileRegex.test(mobile.value)){
    mobileError.innerHTML = 'Please enter a valid number'
    setTimeout(()=>{
       mobileError.innerHTML = ''
    },5000)
    return false;
    }
    
   
    
    // password feild
    if (password.value.trim() === '') {
    passwordError.innerHTML = 'Password cannot be Empty'
    setTimeout(() => {
       passwordError.innerHTML = ''
    }, 5000)
    return false;
    }

     // confirmPassword feild
     if (confirmPassword.value.trim() === '') {
        confirmPassword.innerHTML = 'Password cannot be Empty'
        setTimeout(() => {
            confirmPassword.innerHTML = ''
        }, 5000)
        return false;
        }
    
    
    return true;
    }