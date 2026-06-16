# 빌라톡 ProGuard / R8 룰 — Capacitor + Firebase 환경 안전 보호
# 핵심: 리플렉션·JSI·웹뷰 브리지로 동적 호출되는 클래스 제거 방지

# ───────── 디버그 스택트레이스 ─────────
# 충돌 분석을 위해 라인넘버 정보 유지 (Play Console 의 deobfuscation 업로드에도 필요)
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ───────── Capacitor 코어 ─────────
# 웹뷰 ↔ 네이티브 브리지가 리플렉션으로 호출하는 모든 @Plugin / @PluginMethod 보존
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public *;
}
-keep class * implements com.getcapacitor.Plugin { *; }

# ───────── Capacitor 플러그인 ─────────
-keep class com.capacitorjs.plugins.** { *; }
-keep class io.capawesome.capacitorjs.** { *; }

# ───────── Cordova 호환 레이어 ─────────
-keep class org.apache.cordova.** { *; }
-keep class * extends org.apache.cordova.CordovaPlugin { *; }

# ───────── Firebase / FCM ─────────
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# ───────── AndroidX EdgeToEdge / Activity ─────────
-keep class androidx.activity.** { *; }
-keep class androidx.core.view.** { *; }

# ───────── WebView JavaScript Interface ─────────
# 자바스크립트에서 호출 가능한 @JavascriptInterface 메서드 보존
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ───────── 일반 안전 룰 ─────────
# 어노테이션 / 시그니처 / 익셉션 정보 보존 (리플렉션 안전)
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# Native 메서드 (JNI) 보존
-keepclasseswithmembernames class * {
    native <methods>;
}

# Parcelable / Serializable (안드로이드 표준 직렬화)
-keepclassmembers class * implements android.os.Parcelable {
    public static final ** CREATOR;
}
-keepnames class * implements java.io.Serializable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Enum (toString / valueOf 리플렉션 호출 가능)
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# R 클래스 (리소스 ID — 리플렉션으로 접근 가능)
-keep class **.R$* { *; }
