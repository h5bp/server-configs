# IIS 6 NOTICE

If you're using IIS6 you shouldn't use the supplied `web.config` files.
Instead your changes will need to be made on the server itself.

Contents:

1. Enabling GZip/Deflate
2. Adding/removing Headers
2.1 Removing E-Tags
2.2 Security Headers
2.3 Other Headers


## 1. Enabling GZip/Deflate (IIS6 Server 2003)

In order to enable GZip you will need to enable metabase editing. This can be
done as per [these
instructions](http://www.microsoft.com/technet/prodtechnol/WindowsServer2003/Library/IIS/1d1e5de4-fd63-40cd-bc5d-c20521548eed.mspx?mfr=true)

...

Once you have navigated to the file location (`C:\WINDOWS\SYSTEM32\INETSRV`)
make a copy of the file `metabase.xml` to your desktop or somewhere safe.

Open the file, and search for "IIsCompressionScheme".

Replace the IISCompressionScheme and Schemes XML with the following: (or
alternatively you can see it here: https://gist.github.com/2136507)

```
<IIsCompressionScheme   Location ="/LM/W3SVC/Filters/Compression/deflate"
        HcCompressionDll="%windir%\system32\inetsrv\gzip.dll"
        HcCreateFlags="0"
        HcDoDynamicCompression="TRUE"
        HcDoOnDemandCompression="TRUE"
        HcDoStaticCompression="TRUE"
        HcDynamicCompressionLevel="9"
        HcFileExtensions="htm
            html
            xml
            css
            txt
            rdf
            js
            svg
            ttf
            otf
            eot"
        HcOnDemandCompLevel="10"
        HcPriority="1"
        HcScriptFileExtensions="asp
            cgi
            exe
            dll
            aspx
            asmx
            axd"
    >
</IIsCompressionScheme>
<IIsCompressionScheme   Location ="/LM/W3SVC/Filters/Compression/gzip"
        HcCompressionDll="%windir%\system32\inetsrv\gzip.dll"
        HcCreateFlags="1"
        HcDoDynamicCompression="TRUE"
        HcDoOnDemandCompression="TRUE"
        HcDoStaticCompression="TRUE"
        HcDynamicCompressionLevel="9"
        HcFileExtensions="htm
            html
            xml
            css
            txt
            rdf
            js
            svg
            ttf
            otf
            eot"
        HcOnDemandCompLevel="10"
        HcPriority="1"
        HcScriptFileExtensions="asp
            cgi
            exe
            dll
            aspx
            asmx
            axd"
    >
</IIsCompressionScheme>
<IIsCompressionSchemes  Location ="/LM/W3SVC/Filters/Compression/Parameters"
        HcCacheControlHeader="max-age=86400"
        HcCompressionBufferSize="8192"
        HcCompressionDirectory="C:\IIS Temporary Compressed Files"
        HcDoDiskSpaceLimiting="FALSE"
        HcDoDynamicCompression="TRUE"
        HcDoOnDemandCompression="TRUE"
        HcDoStaticCompression="TRUE"
        HcExpiresHeader="Wed, 01 Jan 1997 12:00:00 GMT"
        HcFilesDeletedPerDiskFree="256"
        HcIoBufferSize="8192"
        HcMaxDiskSpaceUsage="99614720"
        HcMaxQueueLength="1000"
        HcMinFileSizeForComp="1"
        HcNoCompressionForHttp10="FALSE"
        HcNoCompressionForProxies="FALSE"
        HcNoCompressionForRange="FALSE"
        HcSendCacheHeaders="FALSE"
    >
</IIsCompressionSchemes>
```

Note: Never set the compression value to `10`; though this might seem a
sensible thing to do the CPU load increase per-request is quite large, whilst
the actual compression difference is negligible.


## 2. Adding/Removing Headers

### 2.1 Removing ETags

Remove ETags from the Http Response by setting a blank ETag header. In IIS
Manager, right click Web Site (or any folder), click Properties, select
HttpHeaders tab, add Custom Http Header called ETag but leave the value blank.

### 2.2 Security Headers

Using the method above you can add any header; here are a few other common ones
that are in the web.config of H5BP project configs.

For readability I'll separate the KEY from the VALUE using a COLON (e.g. KEY :
VALUE).

#### 2.2.1 Access-Control-Allow-Origin

The 'Access Control Allow Origin' HTTP header is used to control which sites
are allowed to bypass same origin policies and send cross-origin requests.

Secure configuration: Either do not set this header, or return the
'Access-Control-Allow-Origin' header restricting it to only a trusted set of
sites. [Reference](http://enable-cors.org/)

```
Allow All -
Access-Control-Allow-Origin : *
```

#### 2.2.2 Cache-Control

The 'Cache-Control' response header controls how pages can be cached either by
proxies or the users browser. This response header can provide enhanced privacy
by not caching sensitive pages in the users browser cache.

```
Cache-Control : no-store, no-cache
```

#### 2.2.3 Strict Transport Security

The HTTP Strict Transport Security header is used to control if the browser is
allowed to only access a site over a secure connection and how long to remember
the server response for, forcing continued usage.

N.B. Currently a draft standard which only Firefox and Chrome support. But is
supported by sites like PayPal.

```
Strict-Transport-Security : max-age=15768000
```

#### 2.2.4 X-Frame Options


The X-Frame-Options header indicates whether a browser should be allowed to
render a page within a frame or iframe. The valid options are DENY (deny
allowing the page to exist in a frame) or SAMEORIGIN (allow framing but only
from the originating host). Without this option set the site is at a higher risk
of click-jacking.

```
X-Frame-Options : SAMEORIGIN
```

#### 2.2.5 X-XSS Protection

The X-XSS-Protection header is used by Internet Explorer version 8+. The header
instructs IE to enable its inbuilt anti-cross-site scripting filter.  If
enabled, without `mode=block`, there is an increased risk that otherwise
non-exploitable cross-site scripting vulnerabilities may potentially become
exploitable

```
X-XSS-Protection:1; mode=block
```

#### 2.2.6 Manual Removal

You can manually remove X-Powered-By via the same panel you add the headers.
A tiny bit of 'security' by obscurity.

### 2.3 Other Headers

#### 2.3.3 X-UA-Compatible

Force the latest IE version, in various cases when it may fall back to IE7 mode
http://github.com/rails/rails/commit/123eb25#commitcomment-118920

```
X-UA-Compatible : IE=Edge
```

#### 2.3.3 P3P (handy when your using Facebook API/Connect)

Allow cookies to be set from iframes (for IE only)

Ref: http://stackoverflow.com/questions/6241626/facebook-ie-and-p3p

If needed, specify a path or regex in the Location directive

```
P3P : policyref=&quot;/w3c/p3p.xml&quot;, CP=&quot;IDC DSP COR ADM DEVi TAIi PSA PSD IVAi IVDi CONi HIS OUR IND CNT&quot;
```
