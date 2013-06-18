# web.config

**Note this web.config applies to IIS7 and not IIS6.**

In Microsoft IIS server, `web.config` is the configuration file that allows for
web server configuration. The H5BP team have identified a number of best
practice server rules for making web pages fast and secure, these rules can be
applied by configuring `web.config` file.

Many settings inside the `web.config` file embrace best practices for better
web performance. Let's dig into the file and see the list of practices:

**1. Add Expires or Cache-Control Header**

```xml
<clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="30.00:00:00" />
```

The code above set expire headers to 30 days for static content.

Web page designs are getting richer and richer, which means more scripts,
stylesheets, images, and Flash in the page. A first-time visitor to your page
may have to make several HTTP requests, but by using the Expires header you
make those components cacheable. This avoids unnecessary HTTP requests on
subsequent page views. Expires headers are most often used with images, but
they should be used on all components including scripts, stylesheets, and Flash
components.


**2. Gzip Components**

```xml
<httpCompression directory="%SystemDrive%\websites\_compressed" minFileSizeForComp="1024">
    <scheme name="gzip" dll="%Windir%\system32\inetsrv\gzip.dll" />
    <staticTypes>
        <add mimeType="text/*" enabled="true" />
        <add mimeType="message/*" enabled="true" />
        <add mimeType="application/javascript" enabled="true" />
        <add mimeType="application/json" enabled="true" />
        <add mimeType="*/*" enabled="false" />
    </staticTypes>
</httpCompression>
```

GZip static file content. The code above overrides the server default which
only compresses static files over 2700 bytes by setting the minimum file size
for compression to 1024.


**3. Static Compression**

```xml
<urlCompression doStaticCompression="true" />
```

The doStaticCompression attribute of the urlCompression element enables static
content compression at the site, application, or folder level.


**4. Custom 404 page**

```xml
<customErrors mode="RemoteOnly" defaultRedirect="GenericErrorPage.htm">
    <error statusCode="404" redirect="404.html" />
</customErrors>
```

When there is an error, a custom error page is defined as 404.html will be
served to show customized error message.


**5. Force the latest IE version**

```xml
<add name="X-UA-Compatible" value="IE=Edge" />
```

Force the latest IE version, in various cases when it may fall back to IE7
mode


**6. Use UTF-8 encoding**

```xml
<remove fileExtension=".css" />
<mimeMap fileExtension=".css" mimeType="text/css" />
<remove fileExtension=".js" />
<mimeMap fileExtension=".js" mimeType="text/javascript" />
<remove fileExtension=".json" />
<mimeMap fileExtension=".json" mimeType="application/json" />
<remove fileExtension=".rss" />
<mimeMap fileExtension=".rss" mimeType="application/rss+xml; charset=UTF-8" />
<remove fileExtension=".html" />
<mimeMap fileExtension=".html" mimeType="text/html; charset=UTF-8" />
<remove fileExtension=".xml" />
<mimeMap fileExtension=".xml" mimeType="application/xml; charset=UTF-8" />
```

Use UTF-8 encoding for RSS,HTML and XML serve `text/plain` or `text/html`.


**7. Add HTML5 Video MIME Types**

```xml
<mimeMap fileExtension=".mp4" mimeType="video/mp4" />
<mimeMap fileExtension=".m4v" mimeType="video/m4v" />
<mimeMap fileExtension=".ogg" mimeType="video/ogg" />
<mimeMap fileExtension=".ogv" mimeType="video/ogg" />
<mimeMap fileExtension=".webm" mimeType="video/webm" />
```


**8. Proper SVG Serving**

Required for SVG Webfonts on iPad.

```xml
<mimeMap fileExtension=".svg" mimeType="images/svg+xml" />
<mimeMap fileExtension=".svgz" mimeType="images/svg+xml" />
```


**9. HTML4 Web font MIMEtypes**

```xml
<remove fileExtension=".eot" />
<mimeMap fileExtension=".eot" mimeType="application/vnd.ms-fontobject" />
<mimeMap fileExtension=".otf" mimeType="font/opentype" />
<mimeMap fileExtension=".woff" mimeType="application/font-woff" />
```

Remove default IIS mime type for `.eot` which is `application/octet-stream`.
Add the proper MIME types.


**10. Migration Validation**

```xml
<validation validateIntegratedModeConfiguration="false" />
```

Some problems might be overseen while moving an application from classic mode
to integrated mode. Code above can eliminate harmless errors with caused by
migration.


## Beyond the basics

We can see several things one can configure which are by default commented out:

**1. Custom Errors Page**

```xml
<customErrors mode="RemoteOnly" defaultRedirect="GenericErrorPage.htm">
    <error statusCode="403" redirect="NoAccess.htm" />
    <error statusCode="404" redirect="FileNotFound.htm" />
</customErrors>
```

One can comment this portion to enable configuration of what to do if/when an
unhandled error occurs during the execution of a request. Specifically, it
enables developers to configure html error pages to be displayed in place of a
error stack trace.


**2. Serve Cross-domain Ajax Requests**

```xml
<add name="Access-Control-Allow-Origin" value="*" />
```

For security reasons, cross-domain Ajax requests are denied default , to enable
it, uncomment the code above.


**3. Remove the WWW from the URL**

Using a non-www version of a webpage will set cookies for the whole domain
making cookieless domains (eg. fast cdn-like access of static resources like
css, js and images) impossible.

```xml
<rewrite>
    <rules>
        <rule name="Remove WWW" stopProcessing="true">
            <match url="^(.*)$" />
            <conditions>
                <add input="{HTTP_HOST}" pattern="^(www\.)(.*)$" />
            </conditions>
            <action type="Redirect" url="http://example.com{PATH_INFO}" redirectType="Permanent" />
        </rule>
    </rules>
</rewrite>
```


**4. Enable Cachebusting on static files**

This will route all requests to `/path/filename.20120101.ext` to
`/path/filename.ext`. To use this, just add a time-stamp number (or your own
numbered versioning system) into your resource filenames in your HTML source
whenever you update those resources.

```xml
<rewrite>
    <rules>
        <rule name="Cachebusting">
            <match url="^(.+)\.\d+(\.(js|css|png|jpg|gif)$)" />
            <action type="Rewrite" url="{R:1}{R:2}" />
        </rule>
    </rules>
</rewrite>
```


**5. Allow Cookies to be Set from iframes**

```xml
<add name="P3P" value="policyref="/w3c/p3p.xml", CP="IDC DSP COR ADM DEVi TAIi PSA PSD IVAi IVDi CONi HIS OUR IND CNT"" />
```

To allow cookies to be set from iframes (for IE only), uncomment and specify a
path or regex in the Location directive.
