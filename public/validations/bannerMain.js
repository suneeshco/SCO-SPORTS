
    const nameRegex = /^[A-Za-z\s]{2,}$/;

    const imageInput = document.querySelector('input[type="file"]');
    const imageError = document.getElementById('errorImage');

const discription = document.getElementById('cdisc');
const discerror = document.getElementById('errordisc');  

const h1input = document.getElementById('h1')
const h1inputerror = document.getElementById('errorh1')

const h2input = document.getElementById('h2')
const h2inputerror = document.getElementById('errorh2')


const h3input = document.getElementById('h3')
const h3inputerror = document.getElementById('errorh3')

const p1input = document.getElementById('p1')
const p1inputerror = document.getElementById('errorp1')



discription.addEventListener('input', () => {
 var val = discription.value;
 const isValid = validatedisc(val);
});

h1input.addEventListener('input', () => {
 var val = h1input.value;
 const isValid = validateh1(val);
});

h2input.addEventListener('input', () => {
 var val = h2input.value;
 const isValid = validateh2(val);
});

h3input.addEventListener('input', () => {
 var val = h3input.value;
 const isValid = validateh3(val);
});

p1input.addEventListener('input', () => {
 var val = p1input.value;
 const isValid = validatep1(val);
});

imageInput.addEventListener('change', () => {
        const isValid = validateImage(imageInput);
    });

    function validateImage(input) {
        const file = input.files[0];
        if (!file) {
            imageError.textContent = "Please select an image";
            return false;
        } else {
            imageError.textContent = "";
            return true;
        }
    }




function validatedisc(name) {
 if (name.trim().length < 1) {
     discerror.textContent = "Discription cannot be empty"
     return false
 }

 discerror.textContent = ""
 return true
 }




 function validateh1(name) {
 if (name.trim().length < 1) {
     h1inputerror.textContent = "heading cannot be empty"
     return false
 }
 if (!nameRegex.test(name.trim())) {
     h1inputerror.textContent = "Enter a valid heading"
     return false
 }
 h1inputerror.textContent = ""
 return true
 }




 function validateh2(name) {
 if (name.trim().length < 1) {
     h2inputerror.textContent = "heading cannot be empty"
     return false
 }
 if (!nameRegex.test(name.trim())) {
     h2inputerror.textContent = "Enter a valid heading"
     return false
 }
 h2inputerror.textContent = ""
 return true
 }



 function validateh3(name) {
 if (name.trim().length < 1) {
     h3inputerror.textContent = "heading cannot be empty"
     return false
 }
 if (!nameRegex.test(name.trim())) {
     h3inputerror.textContent = "Enter a valid heading"
     return false
 }
 h3inputerror.textContent = ""
 return true
 }





 function validatep1(name) {
 if (name.trim().length < 1) {
     p1inputerror.textContent = "Sub heading cannot be empty"
     return false
 }
 if (!nameRegex.test(name.trim())) {
     p1inputerror.textContent = "Enter a valid sub heading"
     return false
 }
 p1inputerror.textContent = ""
 return true
 }





 function checkCoupon(){
     let discValid = validatedisc(discription.value)
     let h1valid   = validateh1(h1input.value)
     let h2valid   = validateh2(h2input.value)
     let h3valid   = validateh3(h3input.value)
     let p1valid   = validatep1(p1input.value)
     let imageValid = validateImage(imageInput);

     if (discValid && h1valid && h2valid && h3valid && p1valid && imageValid) {
     return true
 } else {
     return false
 }
 }



 //changeStatus

 function  Changestatus(id){
    $.ajax({
        type: 'POST',
        url: '/admin/updateBannerStatus',
        data: { _id: id},
        success: function (response) {
            if (response.success) {
                const updatedStatus = response.update;
                const bannerId = response.bannerId; 
                const statusSpan = document.querySelector(`[data-banner-id="${bannerId}"]`);
                if (statusSpan) {
                    statusSpan.innerText = updatedStatus;
                } else {
                    
                }
            }},
        error: function () {
            
        }
    });
}


 