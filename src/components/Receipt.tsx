import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Printer, X } from "lucide-react";

// مكوّن الإيصال الحراري بمقاس 80mm — يدعم كل أنواع العمليات
export function Receipt({
  receipt,
  onClose,
}: {
  receipt: any;
  onClose: () => void;
}) {
  const children = useQuery(api.children.list) || [];
  const parents = useQuery(api.parents.list) || [];
  const settings = useQuery(api.settings.get);

  const child = receipt.childId
    ? children.find((c) => c._id === receipt.childId)
    : null;
  const parent = child
    ? parents.find((p) => p._id === child.parentId)
    : null;

  const nurseryName = "أكاديمية شروق الشمس";
  const logo = settings?.logo;
  const phone = "01022739772";
  const address = "كفر أحمد شلبي - بجوار المقابر";

  const formatDateTime = (ts: number) => {
    const d = new Date(ts);
    const date = d.toLocaleDateString("ar-SA");
    const time = d.toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { date, time };
  };

  const { date, time } = formatDateTime(receipt.createdAt || Date.now());

  const typeLabel =
    receipt.type === "expense"
      ? "إيصال مصروف"
      : receipt.type === "fee"
        ? "إيصال رسوم"
        : "إيصال دفع";

  const amount = receipt.amount ?? 0;
  const discount = receipt.discount ?? 0;
  const paid = receipt.paid ?? 0;
  const remaining = receipt.remaining ?? 0;

  const handlePrint = () => {
    const printContent = document.getElementById("receipt-print-area");

    if (!printContent) return;

    const printWindow = window.open(
      "",
      "_blank",
      "width=400,height=700"
    );

    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة للطباعة.");
      return;
    }

    printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>إيصال ${receipt.receiptNumber}</title>

        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            width: 80mm !important;
            min-width: 80mm !important;
            max-width: 80mm !important;
            background: #fff !important;
          }

          body {
            font-family: Arial, "Tahoma", sans-serif;
            color: #000;
            direction: rtl;
            font-size: 12px;
            line-height: 1.5;
          }

          #receipt-print-area {
            width: 80mm !important;
            min-height: auto !important;
            padding: 4mm !important;
            margin: 0 !important;
            background: #fff !important;
            color: #000 !important;
          }

          /* إزالة أي خلفيات أو ظلال خاصة بالواجهة */
          .bg-white {
            background: #fff !important;
          }

          /* المحاذاة */
          .text-center {
            text-align: center !important;
          }

          /* Flex */
          .flex {
            display: flex !important;
          }

          .justify-between {
            justify-content: space-between !important;
          }

          .items-center {
            align-items: center !important;
          }

          /* الأحجام */
          .text-xs {
            font-size: 11px !important;
          }

          .text-sm {
            font-size: 12px !important;
          }

          .text-base {
            font-size: 16px !important;
          }

          /* الخط */
          .font-bold {
            font-weight: 700 !important;
          }

          .font-semibold {
            font-weight: 600 !important;
          }

          /* الألوان */
          .text-slate-600 {
            color: #444 !important;
          }

          .text-slate-500 {
            color: #555 !important;
          }

          .text-rose-600 {
            color: #000 !important;
          }

          .text-emerald-600 {
            color: #000 !important;
          }

          /* المسافات */
          .my-2 {
            margin-top: 6px !important;
            margin-bottom: 6px !important;
          }

          .mt-2 {
            margin-top: 6px !important;
          }

          .mb-1 {
            margin-bottom: 4px !important;
          }

          /* الخطوط الفاصلة */
          .border-t {
            border-top-width: 1px !important;
          }

          .border-dashed {
            border-top-style: dashed !important;
          }

          .border-slate-400 {
            border-top-color: #999 !important;
          }

          /* الصور */
          img {
            max-width: 100%;
          }

          /* منع تقطيع الإيصال */
          #receipt-print-area,
          #receipt-print-area * {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          @media print {
            html,
            body {
              width: 80mm !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            #receipt-print-area {
              width: 80mm !important;
              margin: 0 !important;
              padding: 4mm !important;
            }
          }
        </style>
      </head>

      <body>

        <div id="receipt-print-area">
          ${printContent.innerHTML}
        </div>

        <script>
          window.onload = function () {
            setTimeout(function () {
              window.print();

              setTimeout(function () {
                window.close();
              }, 1000);
            }, 300);
          };
        </script>

      </body>
    </html>
  `);

    printWindow.document.close();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">معاينة الإيصال</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              طباعة
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* منطقة الإيصال — 80mm */}
        <div className="p-4 bg-slate-100">
          <div
            id="receipt-print-area"
            className="bg-white mx-auto"
            style={{ width: "80mm", minHeight: "120mm", padding: "4mm" }}
          >
            <div className="text-center">
              {logo && (
                <img
                  src={logo}
                  alt={nurseryName}
                  className="mx-auto mb-1"
                  style={{ width: "48px", height: "48px", objectFit: "contain" }}
                />
              )}
              <div className="font-bold text-base">{nurseryName}</div>
              {address && <div className="text-xs text-slate-600">{address}</div>}
              {phone && <div className="text-xs text-slate-600">هاتف: {phone}</div>}
            </div>

            <div className="border-t border-dashed border-slate-400 my-2" />

            <div className="text-center font-bold text-sm">
              {typeLabel} — {receipt.receiptNumber}
            </div>

            {child && (
              <>
                <div className="border-t border-dashed border-slate-400 my-2" />
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">اسم الطفل:</span>
                  <span className="font-semibold">{child.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">ولي الأمر:</span>
                  <span className="font-semibold">{parent?.name || "—"}</span>
                </div>
              </>
            )}
            <div className="border-t border-dashed border-slate-400 my-2" />

            <div className="flex justify-between text-xs">
              <span className="text-slate-600">التاريخ:</span>
              <span className="font-semibold">{date}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">الوقت:</span>
              <span className="font-semibold">{time}</span>
            </div>


            <div className="border-t border-dashed border-slate-400 my-2" />

            <div className="flex justify-between text-xs">
              <span className="text-slate-600">نوع العملية:</span>
              <span className="font-semibold">{receipt.description || typeLabel}</span>
            </div>
            {receipt.month && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">الفترة:</span>
                <span className="font-semibold">{receipt.month}</span>
              </div>
            )}

            <div className="border-t border-dashed border-slate-400 my-2" />

            <div className="flex justify-between text-xs">
              <span className="text-slate-600">المبلغ:</span>
              <span className="font-semibold">{amount.toLocaleString()} ر.س</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">الخصم:</span>
                <span className="font-semibold text-rose-600">
                  -{discount.toLocaleString()} ر.س
                </span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">المدفوع:</span>
              <span className="font-semibold text-emerald-600">
                {paid.toLocaleString()} ر.س
              </span>
            </div>
            {receipt.type !== "expense" && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">المتبقي:</span>
                <span className="font-semibold text-rose-600">
                  {remaining.toLocaleString()} ر.س
                </span>
              </div>
            )}

            <div className="border-t border-dashed border-slate-400 my-2" />

            {receipt.method && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">طريقة الدفع:</span>
                <span className="font-semibold">{receipt.method}</span>
              </div>
            )}
            {/* <div className="flex justify-between text-xs">
              <span className="text-slate-600">الموظف:</span>
              <span className="font-semibold">{receipt.staffName || "—"}</span>
            </div> */}

            <div className="border-t border-dashed border-slate-400 my-2" />

            <div className="text-center text-xs text-slate-500 mt-2">
              شكراً لثقتكم بنا
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
