using System;
using System.IO;

namespace JustMdViewer.Core
{
    /// <summary>Per-user locations used by the app.</summary>
    public static class AppPaths
    {
        /// <summary><c>%LOCALAPPDATA%\JustMdViewer</c>.</summary>
        public static string DataDirectory =>
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "JustMdViewer");

        /// <summary><c>%LOCALAPPDATA%\JustMdViewer\WebView2</c> (WebView2 user data folder).</summary>
        public static string WebViewDataDirectory => Path.Combine(DataDirectory, "WebView2");
    }
}
