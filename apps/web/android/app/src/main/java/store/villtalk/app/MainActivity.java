package store.villtalk.app;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

/**
 * Android 15 (SDK 35+) edge-to-edge 강제 시행 대응.
 * — EdgeToEdge.enable() 로 시스템 인셋을 WebView 가 인식할 수 있게 노출.
 * — 웹쪽 CSS 의 env(safe-area-inset-*) 가 정상 동작하므로 별도 패딩 처리 불필요.
 */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }
}
