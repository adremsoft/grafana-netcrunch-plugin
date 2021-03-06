/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

import { NetCrunchDefaultMonitoringPacksGenerator } from './defaultMonitoringPacksGenerator';

/* eslint-disable quotes, quote-props */

const
  PRIVATE_PROPERTIES = {
    datasource: Symbol('datasource')
  },

  /*
    DEFAULT_ENGLISH_MONITORING_PACKS have been loaded from fresh installed English NetCrunch server by
    NetCrunchDefaultEnglishMonitoringPacks.printMonitoringPacks().

    printMonitoringPacks() print JSON structure with monitoring packs on dev console which may be copied
    into DEFAULT_ENGLISH_MONITORING_PACKS.
   */

  DEFAULT_ENGLISH_MONITORING_PACKS = {
    "id": 3,
    "children": {
      "Global": {
        "id": 77,
        "children": {
          "Physical Segments": { "id": 215, "children": {} },
          "NetCrunch Audit": { "id": 212, "children": {} },
          "Correlations": { "id": 197, "children": {} },
          "NetCrunch Self Monitor": { "id": 196, "children": {} },
          "Network Traffic (SNMP)": { "id": 193, "children": {} },
          "NetCrunch": { "id": 94, "children": {} },
          "Global Flows": { "id": 85, "children": {} },
          "Open Monitor": { "id": 82, "children": {} },
          "Service Status": { "id": 79, "children": {} },
          "Node Status": { "id": 78, "children": {} }
        }
      },
      "Hardware": {
        "id": 58,
        "children": {
          "Other": {
            "id": 98,
            "children": {
              "Link Aggregation": { "id": 214, "children": {} },
              "Cisco ASA VPN Tunnels": { "id": 209, "children": {} },
              "Cisco Unified Communications Manager": { "id": 208, "children": {} },
              "Generic CMYK Printer": { "id": 207, "children": {} },
              "NetApp I/O Operation Reports": { "id": 186, "children": {} },
              "NetApp Disk Usage": { "id": 185, "children": {} },
              "NetApp System Health": { "id": 184, "children": {} },
              "NetApp Traps": { "id": 183, "children": {} },
              "F5 Local Traffic Manager": { "id": 182, "children": {} },
              "Dell OpenManage (SNMP)": { "id": 33, "children": {} },
              "HP Systems Insight Manager (SNMP)": { "id": 32, "children": {} },
              "APC PowerChute (SNMP)": { "id": 31, "children": {} }
            }
          },
          "Network Devices": {
            "id": 59,
            "children": {
              "HP ProCurve": { "id": 213, "children": {} },
              "Barracuda Spam and Virus Firewall": { "id": 210, "children": {} },
              "Juniper SRX (SNMP)": { "id": 97, "children": {} },
              "Juniper EX Switches HealthMon (SNMP)": { "id": 96, "children": {} },
              "Juniper Sensors (SNMP)": { "id": 95, "children": {} },
              "Cisco (SNMP)": { "id": 71, "children": {} },
              "Alcatel OmniSwitch (SNMP)": { "id": 38, "children": {} }
            }
          }
        }
      },
      "Operating Systems": {
        "id": 26,
        "children": {
          "Solaris": {
            "id": 199,
            "children": {
              "Network Traffic (Solaris)": { "id": 203, "children": {} },
              "Processes (Solaris)": { "id": 202, "children": {} },
              "Solaris (SNMP)": { "id": 201, "children": {} },
              "Solaris": { "id": 200, "children": {} }
            }
          },
          "VMware": {
            "id": 83,
            "children": {
              "VMware VirtualCenter Server 6.0": { "id": 205, "children": {} },
              "VMware ESXi": { "id": 84, "children": {} }
            }
          },
          "BSD": {
            "id": 68,
            "children": {
              "Network Traffic (BSD)": { "id": 192, "children": {} },
              "Processes (BSD)": { "id": 190, "children": {} },
              "BSD": { "id": 69, "children": {} }
            }
          },
          "Mac OS X": {
            "id": 66,
            "children": {
              "Processes (MAC OS)": { "id": 189, "children": {} },
              "Mac OS X": { "id": 67, "children": {} }
            }
          },
          "Other": {
            "id": 63,
            "children": {
              "IBM AS/400 (SNMP)": { "id": 45, "children": {} },
              "IBM AIX (SNMP)": { "id": 44, "children": {} }
            }
          },
          "Novell NetWare": {
            "id": 57,
            "children": {
              "Novell NetWare (SNMP)": { "id": 47, "children": {} }
            }
          },
          "Linux": {
            "id": 56,
            "children": {
              "Network Traffic (Linux)": { "id": 191, "children": {} },
              "Processes (Linux)": { "id": 188, "children": {} },
              "Linux": { "id": 53, "children": {} },
              "Linux (SNMP)": { "id": 46, "children": {} }
            }
          },
          "Windows": {
            "id": 55,
            "children": {
              "Processes (Windows)": { "id": 187, "children": {} },
              "Windows vCenter 5.1": { "id": 166, "children": {} },
              "Distributed File System (DFS)": { "id": 163, "children": {} },
              "Hyper-V Server": { "id": 158, "children": {} },
              "DHCP Server": { "id": 87, "children": {} },
              "DNS Server": { "id": 86, "children": {} },
              "Basic Windows Monitoring": { "id": 64, "children": {} },
              "Windows Server": { "id": 50, "children": {} },
              "Active Directory": { "id": 48, "children": {} },
              "Terminal Services": { "id": 29, "children": {} },
              "Security Audit": { "id": 28, "children": {} },
              "Network Services Health": { "id": 27, "children": {} }
            }
          }
        }
      },
      "Applications": {
        "id": 10,
        "children": {
          "Other": {
            "id": 179,
            "children": {
              "Java Application Server (SNMP)": { "id": 211, "children": {} },
              "Veeam Backup and Replication Server": { "id": 206, "children": {} },
              "AdRem NetCrunch Server": { "id": 178, "children": {} },
              "CiscoWorks Lan Management": { "id": 177, "children": {} },
              "Blackberry Enterprise Service 10 (BES10)": { "id": 174, "children": {} },
              "Avaya Modular Messaging Server": { "id": 173, "children": {} },
              "Citrix Xen App 6.0 Server": { "id": 165, "children": {} },
              "Lotus Domino Server (SNMP)": { "id": 159, "children": {} },
              "Squid 3 (SNMP)": { "id": 157, "children": {} },
              "Oracle 11.2.0": { "id": 156, "children": {} },
              "Apache Server": { "id": 80, "children": {} },
              "ARCServe": { "id": 12, "children": {} },
              "APC Windows Events": { "id": 11, "children": {} }
            }
          },
          "Anti-Virus Software": {
            "id": 101,
            "children": {
              "Sophos Anti-virus Server": { "id": 204, "children": {} },
              "Symantec Backup Exec Server": { "id": 172, "children": {} },
              "Symantec Backup Exec Remote Agent": { "id": 171, "children": {} },
              "Symantec Endpoint Protection Client": { "id": 170, "children": {} },
              "Symantec NetBackup Client": { "id": 169, "children": {} },
              "Symantec NetBackup Server": { "id": 168, "children": {} },
              "Symantec Endpoint Protection Server": { "id": 164, "children": {} },
              "Windows Defender": { "id": 155, "children": {} },
              "ZoneAlarm PRO Antivirus + Firewall 2013": { "id": 145, "children": {} },
              "Webroot SecureAnywhere Antivirus 2012": { "id": 144, "children": {} },
              "Webroot SecureAnywhere Essentials 2012": { "id": 143, "children": {} },
              "Webroot SecureAnywhere Antivirus 2013": { "id": 142, "children": {} },
              "Vipre Antivirus Enterprise": { "id": 141, "children": {} },
              "Vipre Antivirus Premium": { "id": 140, "children": {} },
              "Vipre Antivirus 2013": { "id": 139, "children": {} },
              "Trend Micro Titanium 2013": { "id": 138, "children": {} },
              "Sophos Anti-virus and Firewall": { "id": 136, "children": {} },
              "PC Tools Internet Security 9.0": { "id": 135, "children": {} },
              "Panda Global Protection 2012": { "id": 134, "children": {} },
              "Outpost Antivirus Pro 8": { "id": 133, "children": {} },
              "Norton Internet Security 2013": { "id": 132, "children": {} },
              "Norton AntiVirus 2013": { "id": 131, "children": {} },
              "Norton 360": { "id": 130, "children": {} },
              "Norman Security Suite 2012": { "id": 129, "children": {} },
              "McAfee Total Protection 2013": { "id": 128, "children": {} },
              "Lavasoft Pro": { "id": 127, "children": {} },
              "Lavasoft Ad-Aware Total Security": { "id": 126, "children": {} },
              "Kingsoft Internet Security 9 Plus": { "id": 125, "children": {} },
              "Kingsoft AntiVirus": { "id": 124, "children": {} },
              "Kaspersky Endpoint Security 8": { "id": 123, "children": {} },
              "K7 TotalSecurity": { "id": 122, "children": {} },
              "K7 AntiVirus Premium": { "id": 121, "children": {} },
              "K7 AntiVirus Plus": { "id": 120, "children": {} },
              "G Data Internet Security 2013": { "id": 119, "children": {} },
              "G Data Anti Virus 2013": { "id": 118, "children": {} },
              "F-Secure Internet Security 2013": { "id": 117, "children": {} },
              "F-Secure Anti-Virus 2013": { "id": 116, "children": {} },
              "ESET NOD32 Smart Security 6": { "id": 114, "children": {} },
              "eScan Internet Security Suite v11": { "id": 113, "children": {} },
              "eScan Antivirus Edition v11": { "id": 112, "children": {} },
              "BullGuard Internet Security 2013": { "id": 110, "children": {} },
              "BullGuard Anti-Virus 2013": { "id": 109, "children": {} },
              "BitDefender AntiVirus Plus 2013": { "id": 108, "children": {} },
              "Avira": { "id": 107, "children": {} },
              "AVG Internet Security 2013": { "id": 106, "children": {} },
              "BitDefender Internet Security 2013": { "id": 105, "children": {} },
              "Avast!": { "id": 104, "children": {} },
              "AVG Anti-Virus 2013": { "id": 103, "children": {} },
              "BitDefender Total Security 2012": { "id": 102, "children": {} },
              "Symantec Backup Exec Events": { "id": 25, "children": {} }
            }
          },
          "Microsoft": {
            "id": 62,
            "children": {
              "Exchange 2013 Mailbox Role": { "id": 195, "children": {} },
              "Exchange 2013 Client Access Role": { "id": 194, "children": {} },
              "MS Index Server": { "id": 176, "children": {} },
              "MS BizTalk Server 2009/2010": { "id": 175, "children": {} },
              "MS Project Server": { "id": 167, "children": {} },
              "MS Dynamics AX 2012 Server": { "id": 162, "children": {} },
              "MS Dynamics NAV Server": { "id": 161, "children": {} },
              "MS Dynamics CRM 2011 Server": { "id": 160, "children": {} },
              "SharePoint": { "id": 93, "children": {} },
              "Exchange 2007-2010 Transport Access Server": { "id": 92, "children": {} },
              "Exchange 2007-2010 Mailbox Access Server": { "id": 91, "children": {} },
              "Exchange 2007-2010 Client Access Server": { "id": 90, "children": {} },
              "Forefront TMG 2010": { "id": 88, "children": {} },
              "MS SQL Server": { "id": 54, "children": {} },
              "ISA Server": { "id": 17, "children": {} },
              "IIS": { "id": 15, "children": {} },
              "Exchange 2003": { "id": 14, "children": {} }
            }
          }
        }
      }
    }
  };

/* eslint-enable quotes, quote-props */

class NetCrunchDefaultEnglishMonitoringPacks {

  constructor(datasource) {
    this[PRIVATE_PROPERTIES.datasource] = datasource;
  }

  printMonitoringPacks() {
    const monitoringPacksGenerator = new NetCrunchDefaultMonitoringPacksGenerator(this[PRIVATE_PROPERTIES.datasource]);
    monitoringPacksGenerator.printMonitoringPacks();
  }

  static getMonitoringPackId(monitoringPackPath, monitoringPacksData) {

    function getChildByName(monitoringPackData, childName) {
      let result = null;

      Object.keys(monitoringPackData.children).some((currentChildName) => {
        if (currentChildName.toUpperCase() === childName.toUpperCase()) {
          result = monitoringPackData.children[currentChildName];
          return true;
        }
        return false;
      });

      return result;
    }

    const
      monitoringPacks = (monitoringPacksData == null) ? DEFAULT_ENGLISH_MONITORING_PACKS : monitoringPacksData,
      currentMonitoringPackPath = Array.from(monitoringPackPath),
      currentMonitoringPackName = (currentMonitoringPackPath.length > 0) ? currentMonitoringPackPath.shift() : '',
      currentMonitoringPack = getChildByName(monitoringPacks, currentMonitoringPackName);

    if (currentMonitoringPack != null) {
      if (Object.keys(currentMonitoringPack.children).length === 0) {
        if (currentMonitoringPackPath.length === 0) {
          return currentMonitoringPack.id;
        }
        return null;
      }

      if (currentMonitoringPackPath.length > 0) {
        return NetCrunchDefaultEnglishMonitoringPacks.getMonitoringPackId(currentMonitoringPackPath,
                                                                          currentMonitoringPack);
      }
    }

    return null;
  }

}

export {
  NetCrunchDefaultEnglishMonitoringPacks
};
