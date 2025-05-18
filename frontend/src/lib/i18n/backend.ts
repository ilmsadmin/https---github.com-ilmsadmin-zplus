import fs from 'fs/promises';
import path from 'path';
import { Locale, defaultLocale } from './config';

/**
 * Interface for backend messages
 */
interface BackendMessages {
  errors: Record<string, string>;
  emails: Record<string, Record<string, string>>;
  notifications: Record<string, string>;
  validations: Record<string, string>;
}

// Global cache for backend messages
const backendMessagesCache: Record<Locale, BackendMessages | null> = {
  vi: null,
  en: null,
  zh: null,
  ja: null,
  ar: null,
  he: null,
};

/**
 * Load backend messages from JSON files
 * @param locale The locale to load
 * @returns Promise resolving to the messages object
 */
export async function loadBackendMessages(locale: Locale): Promise<BackendMessages> {
  // Return from cache if available
  if (backendMessagesCache[locale]) {
    return backendMessagesCache[locale]!;
  }
  
  try {
    // In a real implementation, these would be loaded from JSON files
    // For example:
    // const filePath = path.join(process.cwd(), 'i18n', 'backend', `${locale}.json`);
    // const fileContent = await fs.readFile(filePath, 'utf-8');
    // const messages = JSON.parse(fileContent);
    
    // For this implementation, we'll use hardcoded messages
    const messages: BackendMessages = {
      errors: getErrorMessages(locale),
      emails: getEmailMessages(locale),
      notifications: getNotificationMessages(locale),
      validations: getValidationMessages(locale),
    };
    
    // Cache the messages
    backendMessagesCache[locale] = messages;
    
    return messages;
  } catch (error) {
    console.error(`Failed to load backend messages for locale ${locale}:`, error);
    
    // Fallback to default locale
    if (locale !== defaultLocale) {
      return loadBackendMessages(defaultLocale);
    }
    
    // If default locale fails, return empty messages
    return {
      errors: {},
      emails: {},
      notifications: {},
      validations: {},
    };
  }
}

/**
 * Get error messages for a locale
 */
function getErrorMessages(locale: Locale): Record<string, string> {
  const messages: Record<Locale, Record<string, string>> = {
    vi: {
      'not_found': 'Không tìm thấy tài nguyên',
      'unauthorized': 'Không có quyền truy cập',
      'bad_request': 'Yêu cầu không hợp lệ',
      'internal_server_error': 'Lỗi máy chủ nội bộ',
    },
    en: {
      'not_found': 'Resource not found',
      'unauthorized': 'Unauthorized access',
      'bad_request': 'Bad request',
      'internal_server_error': 'Internal server error',
    },
    zh: {
      'not_found': '未找到资源',
      'unauthorized': '未授权访问',
      'bad_request': '错误的请求',
      'internal_server_error': '内部服务器错误',
    },
    ja: {
      'not_found': 'リソースが見つかりません',
      'unauthorized': '許可されていないアクセス',
      'bad_request': '不正なリクエスト',
      'internal_server_error': '内部サーバーエラー',
    },
    ar: {
      'not_found': 'المورد غير موجود',
      'unauthorized': 'وصول غير مصرح به',
      'bad_request': 'طلب غير صالح',
      'internal_server_error': 'خطأ في الخادم الداخلي',
    },
    he: {
      'not_found': 'המשאב לא נמצא',
      'unauthorized': 'גישה לא מורשית',
      'bad_request': 'בקשה לא תקינה',
      'internal_server_error': 'שגיאת שרת פנימית',
    },
  };
  
  return messages[locale] || messages[defaultLocale];
}

/**
 * Get email template messages for a locale
 */
function getEmailMessages(locale: Locale): Record<string, Record<string, string>> {
  const messages: Record<Locale, Record<string, Record<string, string>>> = {
    vi: {
      welcome: {
        subject: 'Chào mừng đến với Hệ thống Multi-Tenant',
        greeting: 'Xin chào {name},',
        body: 'Chúng tôi rất vui mừng khi bạn tham gia với chúng tôi. Hãy bắt đầu bằng cách khám phá các tính năng của chúng tôi.',
        cta: 'Bắt đầu ngay',
      },
      reset_password: {
        subject: 'Yêu cầu đặt lại mật khẩu',
        greeting: 'Xin chào {name},',
        body: 'Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng nhấp vào liên kết bên dưới để đặt lại mật khẩu của bạn.',
        cta: 'Đặt lại mật khẩu',
        expiry: 'Liên kết này sẽ hết hạn sau 24 giờ.',
      },
    },
    en: {
      welcome: {
        subject: 'Welcome to Multi-Tenant System',
        greeting: 'Hello {name},',
        body: 'We are excited to have you on board. Get started by exploring our features.',
        cta: 'Get Started',
      },
      reset_password: {
        subject: 'Password Reset Request',
        greeting: 'Hello {name},',
        body: 'We received a request to reset the password for your account. Please click the link below to reset your password.',
        cta: 'Reset Password',
        expiry: 'This link will expire in 24 hours.',
      },
    },
    // Add other locales with similar structure
    zh: {
      welcome: {
        subject: '欢迎使用多租户系统',
        greeting: '你好 {name}，',
        body: '我们很高兴您加入我们。从探索我们的功能开始。',
        cta: '开始使用',
      },
      reset_password: {
        subject: '密码重置请求',
        greeting: '你好 {name}，',
        body: '我们收到了重置您账户密码的请求。请点击下面的链接重置您的密码。',
        cta: '重置密码',
        expiry: '此链接将在24小时后过期。',
      },
    },
    ja: {
      welcome: {
        subject: 'マルチテナントシステムへようこそ',
        greeting: 'こんにちは {name}様、',
        body: 'ご参加いただき嬉しく思います。私たちの機能を探索して始めましょう。',
        cta: '始める',
      },
      reset_password: {
        subject: 'パスワードリセットリクエスト',
        greeting: 'こんにちは {name}様、',
        body: 'アカウントのパスワードをリセットするリクエストを受け取りました。以下のリンクをクリックしてパスワードをリセットしてください。',
        cta: 'パスワードをリセット',
        expiry: 'このリンクは24時間後に期限切れになります。',
      },
    },
    ar: {
      welcome: {
        subject: 'مرحبًا بك في نظام متعدد المستأجرين',
        greeting: 'مرحبًا {name}،',
        body: 'نحن متحمسون لانضمامك إلينا. ابدأ باستكشاف ميزاتنا.',
        cta: 'ابدأ الآن',
      },
      reset_password: {
        subject: 'طلب إعادة تعيين كلمة المرور',
        greeting: 'مرحبًا {name}،',
        body: 'لقد تلقينا طلبًا لإعادة تعيين كلمة المرور لحسابك. يرجى النقر على الرابط أدناه لإعادة تعيين كلمة المرور الخاصة بك.',
        cta: 'إعادة تعيين كلمة المرور',
        expiry: 'ستنتهي صلاحية هذا الرابط خلال 24 ساعة.',
      },
    },
    he: {
      welcome: {
        subject: 'ברוך הבא למערכת מרובת דיירים',
        greeting: 'שלום {name},',
        body: 'אנו שמחים שהצטרפת אלינו. התחל על ידי חקירת התכונות שלנו.',
        cta: 'התחל עכשיו',
      },
      reset_password: {
        subject: 'בקשה לאיפוס סיסמה',
        greeting: 'שלום {name},',
        body: 'קיבלנו בקשה לאפס את הסיסמה לחשבון שלך. אנא לחץ על הקישור למטה כדי לאפס את הסיסמה שלך.',
        cta: 'אפס סיסמה',
        expiry: 'קישור זה יפוג תוך 24 שעות.',
      },
    },
  };
  
  return messages[locale] || messages[defaultLocale];
}

/**
 * Get notification messages for a locale
 */
function getNotificationMessages(locale: Locale): Record<string, string> {
  const messages: Record<Locale, Record<string, string>> = {
    vi: {
      'new_user': 'Người dùng mới {name} đã tham gia {tenant}',
      'password_changed': 'Mật khẩu của bạn đã được thay đổi thành công',
      'payment_success': 'Thanh toán {amount} thành công cho {plan}',
      'payment_failed': 'Thanh toán {amount} thất bại cho {plan}',
    },
    en: {
      'new_user': 'New user {name} has joined {tenant}',
      'password_changed': 'Your password has been changed successfully',
      'payment_success': 'Payment of {amount} successful for {plan}',
      'payment_failed': 'Payment of {amount} failed for {plan}',
    },
    // Add other locales with similar structure
    zh: {
      'new_user': '新用户 {name} 已加入 {tenant}',
      'password_changed': '您的密码已成功更改',
      'payment_success': '{plan} 的 {amount} 付款成功',
      'payment_failed': '{plan} 的 {amount} 付款失败',
    },
    ja: {
      'new_user': '新しいユーザー {name} が {tenant} に参加しました',
      'password_changed': 'パスワードが正常に変更されました',
      'payment_success': '{plan} の {amount} の支払いが成功しました',
      'payment_failed': '{plan} の {amount} の支払いが失敗しました',
    },
    ar: {
      'new_user': 'انضم المستخدم الجديد {name} إلى {tenant}',
      'password_changed': 'تم تغيير كلمة المرور الخاصة بك بنجاح',
      'payment_success': 'تم دفع {amount} بنجاح لـ {plan}',
      'payment_failed': 'فشل دفع {amount} لـ {plan}',
    },
    he: {
      'new_user': 'משתמש חדש {name} הצטרף ל-{tenant}',
      'password_changed': 'הסיסמה שלך שונתה בהצלחה',
      'payment_success': 'תשלום של {amount} הצליח עבור {plan}',
      'payment_failed': 'תשלום של {amount} נכשל עבור {plan}',
    },
  };
  
  return messages[locale] || messages[defaultLocale];
}

/**
 * Get validation messages for a locale
 */
function getValidationMessages(locale: Locale): Record<string, string> {
  const messages: Record<Locale, Record<string, string>> = {
    vi: {
      'required': '{field} là bắt buộc',
      'min_length': '{field} phải có ít nhất {min} ký tự',
      'max_length': '{field} không được vượt quá {max} ký tự',
      'email_format': 'Địa chỉ email không hợp lệ',
      'password_match': 'Mật khẩu không khớp',
    },
    en: {
      'required': '{field} is required',
      'min_length': '{field} must be at least {min} characters',
      'max_length': '{field} must not exceed {max} characters',
      'email_format': 'Invalid email address',
      'password_match': 'Passwords do not match',
    },
    // Add other locales with similar structure
    zh: {
      'required': '{field} 是必需的',
      'min_length': '{field} 必须至少有 {min} 个字符',
      'max_length': '{field} 不得超过 {max} 个字符',
      'email_format': '无效的电子邮件地址',
      'password_match': '密码不匹配',
    },
    ja: {
      'required': '{field} は必須です',
      'min_length': '{field} は少なくとも {min} 文字必要です',
      'max_length': '{field} は {max} 文字を超えてはいけません',
      'email_format': '無効なメールアドレス',
      'password_match': 'パスワードが一致しません',
    },
    ar: {
      'required': '{field} مطلوب',
      'min_length': 'يجب أن يكون {field} على الأقل {min} أحرف',
      'max_length': 'يجب ألا يتجاوز {field} {max} حرفًا',
      'email_format': 'عنوان بريد إلكتروني غير صالح',
      'password_match': 'كلمات المرور غير متطابقة',
    },
    he: {
      'required': '{field} נדרש',
      'min_length': '{field} חייב להיות לפחות {min} תווים',
      'max_length': '{field} לא יכול לעלות על {max} תווים',
      'email_format': 'כתובת אימייל לא חוקית',
      'password_match': 'הסיסמאות אינן תואמות',
    },
  };
  
  return messages[locale] || messages[defaultLocale];
}
