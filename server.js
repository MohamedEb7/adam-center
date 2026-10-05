const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const XLSX = require("xlsx");

const app = express();
const PORT = process.env.PORT || 3000;

// تشغيل استقبال JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// تشغيل ملفات الموقع
app.use(express.static(path.join(__dirname, "public")));

// إنشاء قاعدة البيانات
const db = new sqlite3.Database("./database.db", (err) => {
    if (err) {
        console.log("Database Error:", err.message);
    } else {
        console.log("Database Connected");
    }
});

// إنشاء جدول الحجوزات
db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        service TEXT NOT NULL,
        message TEXT,
        status TEXT DEFAULT 'جديد',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) {
        console.log("Table Error:", err.message);
    } else {
        console.log("Bookings Table Ready");
    }
});

// تحديث ملف Excel
function updateExcel() {
    db.all("SELECT * FROM bookings ORDER BY id ASC", [], (err, rows) => {

        if (err) {
            console.log("Excel Error:", err.message);
            return;
        }

        const data = rows.map((booking) => ({
            "رقم الحجز": booking.id,
            "الاسم": booking.name,
            "رقم الهاتف": booking.phone,
            "الخدمة": booking.service,
            "الرسالة": booking.message || "",
            "الحالة": booking.status,
            "تاريخ الحجز": booking.created_at
        }));

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "الحجوزات"
        );

        const filePath = path.join(__dirname, "الحجوزات.xlsx");

        XLSX.writeFile(workbook, filePath);

        console.log("تم تحديث ملف الحجوزات.xlsx");
    });
}

// استقبال الحجز
app.post("/api/bookings", (req, res) => {

    const { name, phone, service, message } = req.body;

    if (!name || !phone || !service) {
        return res.status(400).json({
            success: false,
            message: "من فضلك أكمل البيانات المطلوبة"
        });
    }

    const sql = `
        INSERT INTO bookings (name, phone, service, message)
        VALUES (?, ?, ?, ?)
    `;

    db.run(
        sql,
        [name, phone, service, message || ""],
        function(err) {

            if (err) {
                console.log(err.message);

                return res.status(500).json({
                    success: false,
                    message: "حدث خطأ أثناء حفظ الحجز"
                });
            }

            // تحديث ملف Excel بعد حفظ الحجز
            updateExcel();

            res.json({
                success: true,
                message: "تم إرسال الحجز بنجاح",
                bookingId: this.lastID
            });
        }
    );
});

// إنشاء ملف Excel عند تشغيل السيرفر
updateExcel();

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log("Server Running");
    console.log(`http://localhost:${PORT}`);
});