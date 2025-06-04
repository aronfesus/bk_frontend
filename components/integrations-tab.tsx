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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

// Declare FB and fbAsyncInit on window for TypeScript
declare global {
  interface Window {
    FB: any; // You might want to install @types/facebook-js-sdk for better typing
    fbAsyncInit?: () => void;
    checkLoginState?: () => void; // For the onlogin callback
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

  const statusChangeCallback = useCallback((response: any) => {
    console.log('statusChangeCallback response:', response);
    if (response.status === 'connected') {
      setIntegrations(prevIntegrations =>
        prevIntegrations.map(integ =>
          integ.id === 'facebook'
            ? {
                ...integ,
                connected: true,
                account: `User ID: ${response.authResponse.userID}`, // Placeholder, ideally page name
                lastSync: 'Just now',
              }
            : integ
        )
      );
      console.log('Facebook connected. AuthResponse:', response.authResponse);
      // In a real app, use response.authResponse.accessToken to fetch pages:
      // window.FB.api('/me/accounts', function(pageResponse: any) {
      //   console.log('User pages:', pageResponse);
      //   if (pageResponse && !pageResponse.error && pageResponse.data && pageResponse.data.length > 0) {
      //     const firstPage = pageResponse.data[0]; // Let user choose in real app
      //     setIntegrations(prev => prev.map(i => i.id === 'facebook' ? {...i, account: firstPage.name } : i));
      //   }
      // });
    } else {
      console.log('Facebook not connected or not authorized.');
      setIntegrations(prevIntegrations =>
        prevIntegrations.map(integ =>
          integ.id === 'facebook' ? { ...integ, connected: false, account: null, lastSync: null } : integ
        )
      );
    }
  }, [setIntegrations]);

  const checkLoginState = useCallback(() => {
    if (window.FB) {
      window.FB.getLoginStatus(function(response: any) {
        statusChangeCallback(response);
      });
    } else {
      console.error("Facebook SDK not loaded or FB object not available on window.");
    }
  }, [statusChangeCallback]);

  useEffect(() => {
    // Make checkLoginState globally available for the fb-login-button's onlogin attribute
    window.checkLoginState = checkLoginState;

    // Attempt to parse XFBML in case the component rendered after initial SDK load/parse
    // The xfbml:true in FB.init (layout.tsx) should handle initial load,
    // but this is a fallback or for dynamic additions.
    if (window.FB && window.FB.XFBML) {
      try {
        window.FB.XFBML.parse();
        console.log("FB.XFBML.parse() called from IntegrationsTab");
      } catch (e) {
        console.error("Error calling FB.XFBML.parse():", e);
      }
    }

    return () => {
      // Cleanup: remove the global function if this component instance created it
      if (window.checkLoginState === checkLoginState) {
        delete window.checkLoginState;
      }
    };
  }, [checkLoginState]);

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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Integrációk</h2>
        <p className="text-muted-foreground">Csatlakoztassa a következő platformokat a chatbottal való interakcióhoz</p>
      </div>

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
              {integration.connected && (
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
                            // Disconnect Facebook integration
                            console.log('Disconnecting Facebook integration');
                            // Optional: Call FB.logout() if you want to log the user out of FB for your app
                            // FB.logout(function(response) { statusChangeCallback(response); });
                            // For page integration, just updating app state might be enough
                            setIntegrations(prev =>
                              prev.map(i =>
                                i.id === 'facebook'
                                  ? { ...i, connected: false, account: null, lastSync: null }
                                  : i,
                              ),
                            );
                          }}
                        />
                        <Label htmlFor={`integration-${integration.id}`}>Engedélyezve</Label>
                      </div>
                      {/* Optionally, a configure button if needed after connection */}
                      {/* <Button variant="outline" size="sm">Konfigurálás</Button> */}
                    </div>
                  ) : (
                    <div className="flex w-full items-center justify-between">
                       <div className="flex items-center space-x-2">
                          <Switch
                              id={`integration-${integration.id}`}
                              checked={false}
                              disabled // The switch itself doesn't trigger connection for FB
                          />
                          <Label htmlFor={`integration-${integration.id}`}>Letiltva</Label>
                      </div>
                      <div
                        className="fb-login-button"
                        data-size="medium"
                        data-button-type="continue_with"
                        data-use-continue-as="true"
                        data-scope="public_profile,email,pages_show_list,pages_messaging"
                        data-onlogin="checkLoginState();"
                      ></div>
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
                        // Add other configuration actions here if needed
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

