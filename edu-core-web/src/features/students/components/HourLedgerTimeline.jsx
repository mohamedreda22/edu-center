import {
  PlusCircle,
  Gift,
  CheckCircle2,
  ArrowUpCircle,
  ArrowDownCircle,
  XCircle,
  Sliders,
  User,
  Calendar,
} from 'lucide-react';
import React from 'react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/shared/components/ui/card';

const HourLedgerTimeline = ({ history = [] }) => {
  const typeConfigs = {
    PURCHASE: {
      label: 'شراء باقة ساعات',
      color: 'text-green-600 bg-green-50 border-green-200',
      icon: PlusCircle,
    },
    BONUS: {
      label: 'ساعات إضافية (بونص)',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      icon: Gift,
    },
    CONSUMED: {
      label: 'استهلاك حصة تعليمية',
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      icon: CheckCircle2,
    },
    TRANSFER_IN: {
      label: 'تحويل ساعات وارد',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      icon: ArrowDownCircle,
    },
    TRANSFER_OUT: {
      label: 'تحويل ساعات صادر',
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      icon: ArrowUpCircle,
    },
    REFUND: {
      label: 'استرداد مالي للساعات',
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      icon: XCircle,
    },
    ADJUSTMENT: {
      label: 'تعديل إداري',
      color: 'text-slate-600 bg-slate-50 border-slate-200',
      icon: Sliders,
    },
  };

  return (
    <Card className="shadow-md rounded-2xl border border-slate-200">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
          <span>سجل حركات ودورة حياة الساعات (Hour Ledger Timeline)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        {history.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-bold">
              لا توجد حركات ساعات مسجلة بعد لهذا الطالب.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              تظهر هنا حركات الباقات والحصص المكتملة والتسويات تاريخياً.
            </p>
          </div>
        ) : (
          <div className="relative border-r-2 border-slate-100 pr-6 mr-3 space-y-6">
            {history.map((tx) => {
              const cfg = typeConfigs[tx.type] || {
                label: tx.type,
                color: 'text-slate-600 bg-slate-50 border-slate-200',
                icon: Sliders,
              };
              const Icon = cfg.icon;
              const isNegative = tx.amount < 0;

              return (
                <div key={tx._id} className="relative flex items-start gap-4">
                  {/* Icon Node */}
                  <div
                    className={`absolute -right-[37px] top-0.5 w-7 h-7 rounded-full border-2 flex items-center justify-center shadow-sm ${cfg.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Transaction Content */}
                  <div className="flex-1 bg-white p-4 border border-slate-100 rounded-xl shadow-sm hover:shadow transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                      <div>
                        <span className="text-xs font-black text-slate-400 block mb-0.5">
                          {cfg.label}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-800 leading-tight">
                          {tx.description || 'حركة ساعات غير مفسرة'}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-black px-2.5 py-0.5 rounded-lg border ${
                            isNegative
                              ? 'bg-red-50 text-red-700 border-red-100'
                              : 'bg-green-50 text-green-700 border-green-100'
                          }`}
                        >
                          {isNegative ? '' : '+'}
                          {tx.amount} ساعة
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        القائم بالحركة:{' '}
                        {tx.performedBy
                          ? `${tx.performedBy.firstName || ''} ${
                              tx.performedBy.lastName || ''
                            }`.trim()
                          : 'النظام آلي'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        التاريخ:{' '}
                        {new Date(tx.transactionDate).toLocaleDateString(
                          'ar-KW'
                        )}{' '}
                        {new Date(tx.transactionDate).toLocaleTimeString(
                          'ar-KW',
                          { hour: '2-digit', minute: '2-digit' }
                        )}
                      </span>
                      {tx.lessonId && (
                        <span className="text-primary font-bold">
                          مرتبط بحصة: {tx.lessonId.startTime} (تاريخ:{' '}
                          {new Date(tx.lessonId.lessonDate).toLocaleDateString(
                            'ar-KW'
                          )}
                          )
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HourLedgerTimeline;
