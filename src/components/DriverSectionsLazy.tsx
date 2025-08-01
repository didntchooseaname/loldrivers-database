import { memo } from 'react';
import Image from 'next/image';
import type { Driver } from '@/types';

interface DriverSectionsLazyProps {
  driver: Driver;
  expandedSections: Set<string>;
  toggleSection: (sectionId: string) => void;
  index: number;
}

const DriverSectionsLazy = memo(({ 
  driver, 
  expandedSections, 
  toggleSection, 
  index 
}: DriverSectionsLazyProps) => {
  
  // Imported functions section (lazy loaded)
  const renderImportedFunctionsSection = (functions: string[] | undefined) => {
    if (!functions || functions.length === 0) return null;
    
    const sectionId = `functions-${index}`;
    const isExpanded = expandedSections.has(sectionId);
    
    return (
      <div className={`collapsible-section ${isExpanded ? 'expanded' : ''}`} key={sectionId}>
        <div className="collapsible-header" onClick={() => toggleSection(sectionId)}>
          <span className="collapsible-title">
            <i className="fas fa-code"></i> Imported Functions ({functions.length})
          </span>
          <span className="collapsible-icon">
            <i className={isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-right'}></i>
          </span>
        </div>
        {isExpanded && (
          <div className="collapsible-content">
            <div className="collapsible-inner">
              <ul className="functions-list functions-scrollable">
                {functions.map((func, idx) => {
                  const isDangerous = func.toLowerCase().includes('zwterminateprocess');
                  
                  return (
                    <li key={idx} className={`function-item ${isDangerous ? 'dangerous' : ''}`}>
                      {func}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Section des ressources (lazy loaded)
  const renderResourcesSection = (resources: string[] | undefined) => {
    if (!resources || resources.length === 0) return null;
    
    // Filtrer les liens "internal research"
    const filteredResources = resources.filter(resource => {
      if (!resource || !resource.trim()) return false;
      const lowerResource = resource.toLowerCase();
      return !lowerResource.includes('internal research') && 
             !lowerResource.includes('internal-research') &&
             !lowerResource.includes('internal_research');
    });
    
    if (filteredResources.length === 0) return null;
    
    const sectionId = `resources-${index}`;
    const isExpanded = expandedSections.has(sectionId);
    
    return (
      <div className={`collapsible-section ${isExpanded ? 'expanded' : ''}`} key={sectionId}>
        <div className="collapsible-header" onClick={() => toggleSection(sectionId)}>
          <span className="collapsible-title">
            <i className="fas fa-external-link-alt"></i> Resources ({filteredResources.length})
          </span>
          <span className="collapsible-icon">
            <i className={isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-right'}></i>
          </span>
        </div>
        {isExpanded && (
          <div className="collapsible-content">
            <div className="collapsible-inner">
              <div className="resources-list">
                {filteredResources.map((resource, resourceIndex) => {
                  if (!resource || !resource.trim()) return null;
                  
                  // Extract domain for favicon and display name
                  let domain = '';
                  let displayName = resource;
                  try {
                    const url = new URL(resource);
                    domain = url.hostname;
                    displayName = `${domain}${url.pathname}`;
                    if (displayName.length > 60) {
                      displayName = displayName.substring(0, 57) + '...';
                    }
                  } catch {
                    displayName = resource.length > 60 ? resource.substring(0, 57) + '...' : resource;
                  }

                  const faviconUrl = domain && domain.length > 0 && domain.length < 100 
                    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=16` 
                    : null;
                  
                  return (
                    <div 
                      key={`resource-${resourceIndex}`}
                      className="clickable-hash resource-link"
                      onClick={() => window.open(resource, '_blank', 'noopener,noreferrer')}
                      title={resource}
                    >
                      <span className="hash-type">
                        {faviconUrl ? (
                          <Image 
                            src={faviconUrl} 
                            alt={`${domain} favicon`}
                            width={16} 
                            height={16}
                            onError={() => {
                              // Fallback to Font Awesome icon if favicon fails to load
                            }}
                            style={{ display: 'inline-block' }}
                          />
                        ) : null}
                        <i className="fas fa-external-link-alt" style={{ display: faviconUrl ? 'none' : 'inline' }}></i>
                      </span>
                      <span className="hash-value">{displayName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Section des commandes (lazy loaded)
  const renderCommandsSection = (commands: Driver['Commands']) => {
    if (!commands || !commands.Description) return null;
    
    const sectionId = `commands-${index}`;
    const isExpanded = expandedSections.has(sectionId);
    
    return (
      <div className={`collapsible-section ${isExpanded ? 'expanded' : ''}`} key={sectionId}>
        <div className="collapsible-header" onClick={() => toggleSection(sectionId)}>
          <span className="collapsible-title">
            <i className="fas fa-terminal"></i> Commands & Usage
          </span>
          <span className="collapsible-icon">
            <i className={isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-right'}></i>
          </span>
        </div>
        {isExpanded && (
          <div className="collapsible-content">
            <div className="collapsible-inner">
              {commands.OperatingSystem && (
                <div className="command-field">
                  <div className="command-field-header">
                    <i className="fas fa-desktop"></i>
                    <strong>Operating System</strong>
                  </div>
                  <div className="command-field-content">{commands.OperatingSystem}</div>
                </div>
              )}
              {commands.Privileges && (
                <div className="command-field">
                  <div className="command-field-header">
                    <i className="fas fa-user-shield"></i>
                    <strong>Privileges</strong>
                  </div>
                  <div className="command-field-content">{commands.Privileges}</div>
                </div>
              )}
              {commands.Usecase && (
                <div className="command-field">
                  <div className="command-field-header">
                    <i className="fas fa-bullseye"></i>
                    <strong>Use Case</strong>
                  </div>
                  <div className="command-field-content">{commands.Usecase}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="driver-details-sections">
      {renderCommandsSection(driver.Commands)}
      {renderImportedFunctionsSection(driver.ImportedFunctions)}
      {renderResourcesSection(driver.Resources)}
    </div>
  );
});

DriverSectionsLazy.displayName = 'DriverSectionsLazy';

export default DriverSectionsLazy;
