const form = document.getElementById("bookingForm");
const result = document.getElementById("result");

form.addEventListener("submit", async function (e) {

    e.preventDefault();

    const name = document.getElementById("name").value;
    const phone = document.getElementById("phone").value;
    const service = document.getElementById("service").value;
    const message = document.getElementById("message").value;

    result.textContent = "جاري إرسال الحجز...";

    try {

        const response = await fetch("/api/bookings", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name,
                phone,
                service,
                message
            })

        });

        const data = await response.json();

        if (data.success) {

            result.textContent = "✅ تم إرسال الحجز بنجاح";

            form.reset();

        } else {

            result.textContent = "❌ " + data.message;

        }

    } catch (error) {

        console.error(error);

        result.textContent =
            "❌ حدث خطأ، تأكد أن السيرفر يعمل.";

    }

});