import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import ConfirmationModal from "./ConfirmationModal";
import AddRecordDrawer from "../components/AddRecordDrawer";
import CollectionTable from "../components/CollectionTable";
import DatabaseSidebar from "../components/DatabaseSidebar";
import RowDetailDrawer from "../components/RowDetailDrawer";
import RecordList from "../components/RecordList";
import {
  Database as DbIcon,
  Plus,
  RefreshCw,
  Code,
  Table as TableIcon,
  List as ListIcon,
  Menu,
  FileText,
} from "lucide-react";

import { API_URL } from "../config";

export default function Database() {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [project, setProject] = useState(null);
  const [collections, setCollections] = useState([]);
  const [activeCollection, setActiveCollection] = useState(null);
  const [data, setData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  //used showModal to open the Confirmation model
  const [showModal, setShowModal] = useState(false);
  //keeping track of the selected record in the collection
  const [selectedId, setSelectedId] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null); // For detail drawer

  const fetchShowModal = (id) => {
    setShowModal(true);
    setSelectedId(id);
  };
  // Fetch Project & Collections
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProject(res.data);
        setCollections(res.data.collections || []);

        const queryCollection = searchParams.get("collection");
        if (queryCollection) {
          const found = res.data.collections.find(
            (c) => c.name === queryCollection
          );
          if (found) setActiveCollection(found);
        } else if (res.data.collections.length > 0) {
          setActiveCollection(res.data.collections[0]);
        }
      } catch {
        toast.error("Failed to load project");
      }
    };
    fetchProject();
  }, [projectId, token, searchParams]);

  const fetchData = useCallback(async () => {
    if (!activeCollection) return;
    setLoadingData(true);
    try {
      const res = await axios.get(
        `${API_URL}/api/projects/${projectId}/collections/${activeCollection.name}/data`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      setLoadingData(false);
    }
  }, [activeCollection, projectId, token]);

  // Fetch Data on Collection Change
  useEffect(() => {
    if (!activeCollection) return;
    setSearchParams({ collection: activeCollection.name });
    setSelectedRecord(null); // Close any open record detail drawer
    fetchData();
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  }, [activeCollection, fetchData, setSearchParams]);

  const handleDelete = async (id) => {
    // if (!window.confirm("Are you sure you want to delete this document?"))
    //   return;
    try {
      await axios.delete(
        `${API_URL}/api/projects/${projectId}/collections/${activeCollection.name}/data/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setData((prev) => prev.filter((item) => item._id !== id));
      toast.success("Document deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete document");
    }
  };

  const handleAddDocument = async (submittedData) => {
    setIsSubmitting(true);
    try {
      await axios.post(
        `${API_URL}/api/projects/${projectId}/collections/${activeCollection.name}/data`,
        submittedData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Document added successfully");
      setIsAddModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to add data");
    } finally {
      setIsSubmitting(false);
    }
  };



  // --- SUB-COMPONENTS --- //





  const TableView = () => (
    <div className="table-container-wrapper" style={{ height: "100%", overflow: "hidden" }}>
      <CollectionTable
        data={data}
        activeCollection={activeCollection}
        onDelete={fetchShowModal}
        onView={setSelectedRecord}
      />
    </div>
  );

  const JsonView = () => (
    <div
      className="json-container fade-in"
      style={{ height: "100%", overflowY: "auto" }}
    >
      <pre className="json-pre">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );

  const SkeletonLoader = () => (
    <div className="skeleton-container">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="skeleton-row">
          <div className="skeleton skeleton-text w-full"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="db-layout">
      {/* Mobile Overlay */}
      <div
        className={`sidebar-backdrop ${isSidebarOpen ? "active" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <DatabaseSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        collections={collections}
        activeCollection={activeCollection}
        setActiveCollection={setActiveCollection}
        project={project}
        navigate={navigate}
        projectId={projectId}
      />

      <RowDetailDrawer
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
        fields={activeCollection?.model || []}
      />

      {showModal && (
        <ConfirmationModal
          open={showModal}
          title="Delete Record"
          message="Are you sure you want to delete this record? This action cannot be undone."
          onConfirm={() => {
            handleDelete(selectedId);
            setShowModal(false);
          }}
          onCancel={() => setShowModal(false)}
        />
      )}

      <main className="db-main">
        {activeCollection ? (
          <>
            <header className="db-header glass-panel">
              <div className="header-left">
                <button
                  className="btn-icon hide-desktop menu-trigger"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu size={20} />
                </button>
                <div>
                  <div className="breadcrumbs">
                    <span className="crumb-project">{project?.name}</span>
                    <span className="crumb-sep">/</span>
                    <span className="crumb-col">{activeCollection.name}</span>
                  </div>
                  <h1 className="header-title">{activeCollection.name}</h1>
                </div>
              </div>

              <div className="header-actions">
                <span className="record-count">{data.length} Records</span>

                <div className="view-toggle">
                  <button
                    className={`toggle-btn ${viewMode === "list" ? "active" : ""
                      }`}
                    onClick={() => setViewMode("list")}
                    title="List View"
                  >
                    <ListIcon size={16} />
                  </button>
                  <button
                    className={`toggle-btn ${viewMode === "table" ? "active" : ""
                      }`}
                    onClick={() => setViewMode("table")}
                    title="Table View (Advanced)"
                  >
                    <TableIcon size={16} />
                  </button>
                  <button
                    className={`toggle-btn ${viewMode === "json" ? "active" : ""
                      }`}
                    onClick={() => setViewMode("json")}
                    title="JSON View"
                  >
                    <Code size={16} />
                  </button>
                </div>

                <button
                  onClick={fetchData}
                  className="btn btn-secondary btn-icon-only"
                >
                  <RefreshCw
                    size={18}
                    className={loadingData ? "animate-spin" : ""}
                  />
                </button>

                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="btn btn-primary"
                >
                  <Plus size={18} />
                  <span className="hide-mobile">Add Record</span>
                </button>
              </div>
            </header>

            <div className="db-content">
              {loadingData ? (
                <SkeletonLoader />
              ) : data.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon-wrapper">
                    <FileText size={40} />
                  </div>
                  <h3>No data found</h3>
                  <p>Start by adding your first document to this collection.</p>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="btn btn-primary mt-4"
                  >
                    Add Document
                  </button>
                </div>
              ) : viewMode === "list" ? (
                <RecordList
                  data={data}
                  activeCollection={activeCollection}
                  onView={setSelectedRecord}
                />
              ) : viewMode === "table" ? (
                <TableView />
              ) : (
                <JsonView />
              )}
            </div>
          </>
        ) : (
          <div className="no-collection-state">
            <button
              className="btn-icon hide-desktop menu-trigger absolute-trigger"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="center-content">
              <DbIcon size={48} className="text-muted mb-4 opacity-20" />
              <h2>Select a Collection</h2>
              <p className="text-muted">
                Choose a collection from the sidebar to manage your data.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Add Record Drawer */}
      {isAddModalOpen && (
        <AddRecordDrawer
          key={activeCollection?._id}
          isOpen={true}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddDocument}
          fields={activeCollection?.model || []}
          isSubmitting={isSubmitting}
        />
      )}

      <style>{`
                /* Component Specific Styles */
                .db-layout {
                    display: flex;
                    height: 100%; /* Fill the proper container */
                    overflow: hidden;
                    background: var(--color-bg-main);
                    position: relative;
                }



                /* Main Content Area */
                .db-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    overflow: hidden;
                    min-width: 0; /* Critical for flex child scrolling */
                }

                .db-header {
                    padding: 1rem 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid var(--color-border);
                    z-index: 100;
                    flex-shrink: 0; /* Prevent header from collapsing */
                    background: var(--color-bg-main);
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .breadcrumbs {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.85rem;
                    color: var(--color-text-muted);
                    margin-bottom: 4px;
                }
                
                .header-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin: 0;
                    line-height: 1.2;
                }

                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .db-content {
                    flex: 1;
                    overflow: hidden; /* For table scroll */
                    padding: 0;
                    position: relative;
                    min-width: 0; /* Critical for flex child scrolling */
                }

                /* Component View Toggle styles moved to global for consistency */
                .view-toggle {
                    background: rgba(255,255,255,0.05);
                    padding: 3px;
                    border-radius: 6px;
                    display: flex;
                    gap: 2px;
                }

                .toggle-btn {
                    padding: 6px;
                    border: none;
                    background: transparent;
                    color: var(--color-text-muted);
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                }

                .toggle-btn.active {
                    background: var(--color-bg-card);
                    color: white;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                }

                /* Empty & Loading States */
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: var(--color-text-muted);
                }

                .empty-icon-wrapper {
                    background: rgba(255,255,255,0.03);
                    padding: 2rem;
                    border-radius: 50%;
                    margin-bottom: 1.5rem;
                }

                .skeleton-container {
                    padding: 2rem;
                }
                .skeleton-row {
                    height: 48px;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                }
                .skeleton-text {
                    height: 20px;
                    border-radius: 4px;
                }
                
                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(4px);
                    z-index: 1200;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                }

                .modal-content {
                    width: 100%;
                    max-width: 450px;
                    background: #111;
                    border: 1px solid #333;
                    border-radius: 8px;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                    overflow: hidden;
                }

                .modal-header {
                    padding: 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #222;
                }

                .modal-body {
                    padding: 1.5rem;
                }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 2rem;
                }
                
                .field-type-hint {
                    float: right;
                    font-size: 0.7rem;
                    background: rgba(255,255,255,0.1);
                    padding: 2px 6px;
                    border-radius: 3px;
                }

                /* Mobile Response */
                @media (max-width: 768px) {
                    .db-sidebar {
                        position: absolute;
                        height: 100%;
                        transform: translateX(-100%);
                        box-shadow: 5px 0 15px rgba(0,0,0,0.5);
                    }
                    .db-sidebar.open {
                        transform: translateX(0);
                    }
                    .sidebar-backdrop.active {
                        position: absolute;
                        inset: 0;
                        background: rgba(0,0,0,0.5);
                        z-index: 50;
                        backdrop-filter: blur(2px);
                    }
                    .db-header {
                        padding: 1rem;
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }
                    .header-left {
                        width: 100%;
                    }
                    .header-actions {
                        width: 100%;
                        justify-content: space-between;
                    }
                    .record-count {
                        display: none;
                    }
                }
                
                .json-pre {
                    padding: 1.5rem;
                    color: #3ECF8E;
                    font-family: 'Fira Code', monospace;
                    font-size: 0.85rem;
                    overflow: auto;
                    height: 100%;
                    white-space: pre-wrap;
                    word-break: break-all;
                }
                
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                
                .slide-up {
                    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .no-collection-state {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                .absolute-trigger {
                    position: absolute;
                    top: 1rem;
                    left: 1rem;
                    z-index: 20;
                }
                .center-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
                .opacity-20 { opacity: 0.2; }
                .text-muted { color: var(--color-text-muted); }
                .mb-4 { margin-bottom: 1rem; }
            `}</style>
    </div>
  );
}