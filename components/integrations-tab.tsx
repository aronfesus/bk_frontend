"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Facebook, Twitter, Instagram, Linkedin, MessageSquare, Globe, AlertCircle, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

// Declare FB and fbAsyncInit on window for TypeScript
declare global {
  interface Window {
    FB: any; // You might want to install @types/facebook-js-sdk for better typing
    fbAsyncInit?: () => void;
    // window.checkLoginState is no longer used by this component
  }
}

interface Integration {
  id: string
  name: string
  description: string
  icon: any // Using any for the icon type to keep it simple
  color: string
  connected: boolean
  account: string | null
  lastSync: string | null
}

interface ManageablePage {
  id: string;
  name: string;
  accessToken: string; // Long-lived Page Access Token
  category: string;
  // tasks: string[]; // tasks might not be needed for client-side display initially
}

// Mock data for integrations
const initialIntegrations: Integration[] = [
  {
    id: "facebook",
    name: "Facebook",
    description: "Facebook Messenger integrációja",
    icon: Facebook,
    color: "bg-blue-600",
    connected: false,
    account: null,
    lastSync: null,
  },
  {
    id: "website",
    name: "Weboldal Chat",
    description: "Weboldal Chat integrációja",
    icon: Globe,
    color: "bg-emerald-600",
    connected: true,
    account: "www.biztoskesz.hu",
    lastSync: "3 hours ago",
  },
]

export function IntegrationsTab() {
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations)
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [connectingIntegration, setConnectingIntegration] = useState<string | null>(null)
  const [accountName, setAccountName] = useState("")
  const [showWebsiteCode, setShowWebsiteCode] = useState(false)

  const [manageablePages, setManageablePages] = useState<ManageablePage[]>([]);
  const [showPageSelectionDialog, setShowPageSelectionDialog] = useState(false);
  const [isFacebookConnecting, setIsFacebookConnecting] = useState(false);
  const [facebookError, setFacebookError] = useState<string | null>(null);

  const statusChangeCallback = useCallback(async (response: any) => {
    console.log('statusChangeCallback invoked. Response:', response);
    // Note: setIsFacebookConnecting(false) is handled by the caller (handleFacebookLoginAttempt) 
    // or in the finally block of the connected path if login was successful initially.

    if (response.status === 'connected' && response.authResponse) {
      // This setIsFacebookConnecting(true) is for the API calls part, not the FB.login part.
      setIsFacebookConnecting(true); 
      setFacebookError(null); // Clear previous errors if we are now connected.
      const { userID: facebookUserId, accessToken: shortLivedUserAccessToken, grantedScopes } = response.authResponse;
      console.log('Facebook user connected to app. User ID:', facebookUserId, 'Granted Scopes:', grantedScopes);

      try {
        const apiRes = await fetch('/api/facebook/get-manageable-pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ facebookUserId, shortLivedUserAccessToken }),
        });
        const data = await apiRes.json();
        if (!apiRes.ok) {
          throw new Error(data.message || data.error || 'Failed to fetch manageable pages');
        }
        if (data.pages && data.pages.length > 0) {
          if (!grantedScopes || !grantedScopes.includes('pages_show_list')) {
             console.warn('Successfully fetched pages, but pages_show_list was not in grantedScopes. This might be unexpected.', grantedScopes);
          }
          setManageablePages(data.pages);
          setShowPageSelectionDialog(true);
        } else {
          let noPagesMessage = 'No manageable Facebook Pages found for your account.';
          if (!grantedScopes || !grantedScopes.includes('pages_show_list')) {
            noPagesMessage = 'The required permission (pages_show_list) to view your pages was not granted. Please try connecting again and ensure you approve this permission.';
          }
          setFacebookError(noPagesMessage);
          setIntegrations(prev => prev.map(i => i.id === 'facebook' ? {...i, connected: false, account: 'No pages found', lastSync: 'Just now' } : i));
        }
      } catch (error: any) {
        console.error('Error fetching/processing manageable pages:', error);
        setFacebookError(error.message || 'An unexpected error occurred while fetching pages.');
        setIntegrations(prev => prev.map(i => i.id === 'facebook' ? { ...i, connected: false, account: null, lastSync: null } : i));
      } finally {
        // This finally block specifically handles the API call phase after a successful FB connection.
        setIsFacebookConnecting(false);
      }
    } else {
      console.log('Facebook login status not \'connected\'. Status:', response.status);
      let errMsg = 'Could not connect to Facebook.';
      if (response.status === 'not_authorized') {
        errMsg = 'App authorization declined. Please accept the permissions to connect.';
      } else if (response.status === 'unknown') {
        errMsg = 'Not logged into Facebook or connection cancelled.';
      }
      if (response.error) { // Check if FB.login itself returned an error
        errMsg = `Facebook login error: ${response.error.message || response.error}`;
      }
      setFacebookError(errMsg);
      setIntegrations(prevIntegrations =>
        prevIntegrations.map(integ =>
          integ.id === 'facebook' ? { ...integ, connected: false, account: null, lastSync: null } : integ
        )
      );
      // setIsFacebookConnecting(false) is handled by the calling function (handleFacebookLoginAttempt)
      // if this 'else' block is reached after an FB.login() call.
    }
  }, [setIntegrations, setManageablePages, setShowPageSelectionDialog, setIsFacebookConnecting, setFacebookError]);

  const handleFacebookLoginAttempt = useCallback(() => {
    if (!window.FB) {
      console.error("Facebook SDK not loaded or FB object not available on window.");
      setFacebookError("Facebook SDK failed to load. Please refresh the page.");
      return;
    }

    setIsFacebookConnecting(true);
    setFacebookError(null);

    window.FB.getLoginStatus(function(response: any) {
      if (response.status === 'connected') {
        console.log('FB.getLoginStatus: Already connected. Proceeding with statusChangeCallback.');
        // statusChangeCallback will set isFacebookConnecting to false in its finally block after API calls.
        statusChangeCallback(response);
      } else {
        console.log('FB.getLoginStatus: Not connected. Status:', response.status, 'Attempting FB.login().');
        window.FB.login(function(loginResponse: any) {
          // statusChangeCallback will handle the loginResponse.
          statusChangeCallback(loginResponse);
          // If login was not successful (e.g., cancelled), statusChangeCallback's 'else' block runs.
          // We need to ensure isFacebookConnecting is reset if the connected path in statusChangeCallback is not hit.
          if (loginResponse.status !== 'connected') {
            setIsFacebookConnecting(false);
          }
        }, {
          scope: 'public_profile,email,pages_show_list,pages_messaging',
          return_scopes: true // To check granted scopes later
        });
      }
    });
  }, [statusChangeCallback, setIsFacebookConnecting, setFacebookError]);

  const handleConnectPage = async (page: ManageablePage) => {
    setIsFacebookConnecting(true);
    setFacebookError(null);
    try {
      const apiRes = await fetch('/api/facebook/store-page-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pageId: page.id, 
          pageName: page.name, 
          pageAccessToken: page.accessToken 
        }),
      });

      const data = await apiRes.json();

      if (!apiRes.ok) {
        throw new Error(data.message || data.error || 'Failed to store page token');
      }

      setIntegrations(prev => prev.map(i => 
        i.id === 'facebook' 
          ? { ...i, connected: true, account: page.name, lastSync: 'Just now' } 
          : i
      ));
      setShowPageSelectionDialog(false);
      console.log('Successfully connected page:', page.name);

    } catch (error: any) {
      console.error('Error storing page token:', error);
      setFacebookError(error.message || 'An error occurred while connecting the page.');
    } finally {
      setIsFacebookConnecting(false);
    }
  };

  const toggleIntegration = (id: string) => {
    setIntegrations(
      integrations.map((integration) =>
        integration.id === id
          ? {
              ...integration,
              connected: !integration.connected,
              account: integration.connected
                ? null
                : accountName || integration.account || `Default ${integration.name} Account`,
              lastSync: integration.connected ? null : "Just now",
            }
          : integration,
      ),
    )
  }

  const handleConnect = (id: string) => {
    setConnectingIntegration(id)
    setAccountName("")
    setShowConnectDialog(true)
  }

  const confirmConnect = () => {
    if (connectingIntegration) {
      toggleIntegration(connectingIntegration)
      setShowConnectDialog(false)
      setConnectingIntegration(null)
    }
  }

  const getIntegrationById = (id: string) => {
    return integrations.find((integration) => integration.id === id)
  }

  useEffect(() => {
    // This useEffect is intentionally kept minimal. If FB.XFBML.parse() is needed for other
    // dynamic XFBML content, it should be handled carefully, ensuring FB SDK is loaded.
    // For the login button, we are not using XFBML anymore.
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Integrációk</h2>
        <p className="text-muted-foreground">Csatlakoztassa a következő platformokat a chatbottal való interakcióhoz</p>
      </div>

      {facebookError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Facebook Integration Error</AlertTitle>
          <AlertDescription>{facebookError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`rounded-md p-2 ${integration.color} text-white`}>
                    <integration.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">{integration.name}</CardTitle>
                </div>
                <Badge variant={integration.connected ? "default" : "secondary"}>
                  {integration.connected ? "Sikeresen csatlakoztatva" : "Nincs csatlakoztatva"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">{integration.description}</CardDescription>
              {integration.connected && integration.account && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fiók:</span>
                    <span className="font-medium">{integration.account}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Utoljára szinkronizálva:</span>
                    <span>{integration.lastSync}</span>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 py-3">
              {integration.id === 'facebook' ? (
                <>
                  {integration.connected ? (
                    <div className="flex w-full flex-col items-start space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`integration-${integration.id}`}
                          checked={true}
                          onCheckedChange={() => {
                            console.log('Disconnecting Facebook integration');
                            setIntegrations(prev =>
                              prev.map(i =>
                                i.id === 'facebook'
                                  ? { ...i, connected: false, account: null, lastSync: null }
                                  : i,
                              ),
                            );
                            setFacebookError(null);
                          }}
                        />
                        <Label htmlFor={`integration-${integration.id}`}>Engedélyezve</Label>
                      </div>
                    </div>
                  ) : (
                    <div className="flex w-full items-center justify-between">
                       <div className="flex items-center space-x-2">
                          <Switch
                              id={`integration-${integration.id}`}
                              checked={false}
                              disabled 
                          />
                          <Label htmlFor={`integration-${integration.id}`}>Letiltva</Label>
                      </div>
                      <Button 
                        onClick={handleFacebookLoginAttempt}
                        disabled={isFacebookConnecting}
                        size="sm"
                      >
                        {isFacebookConnecting ? 'Csatlakozás...' : 'Connect with Facebook'}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`integration-${integration.id}`}
                      checked={integration.connected}
                      onCheckedChange={() => {
                        if (!integration.connected) {
                          handleConnect(integration.id);
                        } else {
                          toggleIntegration(integration.id);
                        }
                      }}
                    />
                    <Label htmlFor={`integration-${integration.id}`}>
                      {integration.connected ? "Engedélyezve" : "Letiltva"}
                    </Label>
                  </div>
                  {integration.connected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (integration.id === "website") {
                          setShowWebsiteCode(true);
                        }
                      }}
                    >
                      Konfigurálás
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => handleConnect(integration.id)}>
                      Connect
                    </Button>
                  )}
                </>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Connect {connectingIntegration && getIntegrationById(connectingIntegration)?.name}
            </DialogTitle>
            <DialogDescription>Enter your account details to connect this integration.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="account-name">Account Name or URL</Label>
              <Input
                id="account-name"
                placeholder={`Enter your ${connectingIntegration} account name`}
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>
            <Alert variant="default" className="bg-muted">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                In a real application, this would redirect you to authenticate with the service.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmConnect}>Connect Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPageSelectionDialog} onOpenChange={setShowPageSelectionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Facebook Page to Connect</DialogTitle>
            <DialogDescription>
              Choose which Facebook Page you want to integrate for Messenger.
            </DialogDescription>
          </DialogHeader>
          {manageablePages.length > 0 ? (
            <div className="space-y-2 py-4 max-h-60 overflow-y-auto">
              {manageablePages.map((page) => (
                <Button 
                  key={page.id} 
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleConnectPage(page)}
                  disabled={isFacebookConnecting}
                >
                  {page.name} ({page.category})
                </Button>
              ))}
            </div>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">No pages found to select.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPageSelectionDialog(false)} disabled={isFacebookConnecting}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showWebsiteCode} onOpenChange={setShowWebsiteCode}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Website Chat Widget Code</DialogTitle>
            <DialogDescription>Add this code to your website to enable the chat widget.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="rounded-md bg-muted p-4">
              <pre className="text-xs overflow-auto">
                {`<script>
  (function(w, d, s, o) {
    w['AcmeBotWidget'] = o;
    w[o] = w[o] || function() {
      (w[o].q = w[o].q || []).push(arguments);
    };
    var js = d.createElement(s);
    js.src = 'https://cdn.acmebot.com/widget.js';
    js.async = 1;
    d.head.appendChild(js);
  })(window, document, 'script', 'acmeBot');
  
  acmeBot('init', { 
    botId: 'BOT12345',
    theme: 'light',
    position: 'right'
  });
</script>`}
              </pre>
            </div>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>This widget is already active on acmecorp.com</AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWebsiteCode(false)}>
              Close
            </Button>
            <Button>Copy Code</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

