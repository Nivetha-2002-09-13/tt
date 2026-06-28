import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import CreateGroupsModal from "../components/CreateGroupsModal";
import GroupStandings from "../components/GroupStandings";
import RecordGroupScoreModal from "../components/RecordGroupScoreModal";
import KnockoutBracket from "../components/KnockoutBracket";
import GuestRegistrationModal from "../components/GuestRegistrationModal";
import { Link } from "react-router-dom";
import CreateKnockoutModal from "../components/CreateKnockoutModal";
import WinnerCelebration from "../components/WinnerCelebration";

interface Category {
  id: string;
  name: string;
  type: string;
  maxParticipants: number;
  currentParticipants: number;
  minAge?: number;
  maxAge?: number;
  _count?: {
    registrations: number;
  };
}

interface Match {
  id: string;
  round: string;
  matchNumber: number;
  scheduledTime: string;
  status: string;
  score?: string;
  player1: { firstName: string; lastName: string } | null;
  player2: { firstName: string; lastName: string } | null;
}

interface Registration {
  id: string;
  playerId: string;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  category?: {
    id: string;
    name: string;
    type: string;
  };
  status: string;
  registeredAt: string;
}

interface Tournament {
  id: string;
  name: string;
  description: string;
  venue: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  status: string;
  maxPlayers: number;
  tournamentType?: string;
  categories: Category[];
  registrations: Registration[];
  matches?: Match[];
}

const TournamentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return <div className="text-center py-12">Invalid tournament ID</div>;
  }
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [registering, setRegistering] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [tournamentType, setTournamentType] = useState("KNOCKOUT");
  const [showGroupsModal, setShowGroupsModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [refreshGroups, setRefreshGroups] = useState(false);
  //const [creatingGroups, setCreatingGroups] = useState(false);
  const [_generatingMatches, setGeneratingMatches] = useState(false);
  const [playerAge, setPlayerAge] = useState<number | null>(null);
  const [winners, setWinners] = useState<{
    first: any;
    second: any;
    third: any;
  } | null>(null);
  const [showWinners, setShowWinners] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    venue: "",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    maxPlayers: "",
  });
  const [editCategories, setEditCategories] = useState<Category[]>([]);
  const [partnerDetails, setPartnerDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [selectedDoublesCategory, setSelectedDoublesCategory] = useState<
    string | null
  >(null);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showKnockoutModal, setShowKnockoutModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    fetchTournamentDetails();
  }, [id]);

  useEffect(() => {
    if (showWinners && winners?.first) {
      const seenKey = `seen_celebration_${id}`;
      if (!localStorage.getItem(seenKey)) {
        setShowCelebration(true);
        localStorage.setItem(seenKey, "true");
      }
    }
  }, [showWinners, winners, id]);

  useEffect(() => {
    if (tournament?.status === "COMPLETED") {
      fetchWinners();
    }
  }, [tournament?.status]);

  const calculateAge = (dateOfBirth: string | Date): number => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const isPlayerEligibleForCategory = (
    category: Category,
    age: number | null,
  ): boolean => {
    if (age === null) return true;
    if (category.minAge && age < category.minAge) return false;
    if (category.maxAge && age > category.maxAge) return false;
    return true;
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const fetchTournamentDetails = async () => {
    try {
      const response = await api.get(`/tournaments/${id}`);
      const tournamentData = response.data.data;

      if (user?.role === "ADMIN") {
        const regResponse = await api.get(`/registrations/tournaments/${id}`);
        tournamentData.registrations = regResponse.data.data;
      }

      setTournament(tournamentData);
      setTournamentType(tournamentData?.tournamentType || "KNOCKOUT");

      // Set player age if logged in as player
      if (user?.role === "PLAYER") {
        const profileResponse = await api.get("/users/profile");
        const dob = profileResponse.data.data.playerProfile?.dateOfBirth;
        if (dob) {
          setPlayerAge(calculateAge(dob));
        }
      }
    } catch (error) {
      toast.error("Failed to fetch tournament details");
      navigate("/tournaments");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (selectedCategories.length === 0) {
      toast.error("Please select at least one category");
      return;
    }

    // Check if any selected category is doubles and partner details are missing
    const hasDoublesWithoutPartner = selectedCategories.some((catId) => {
      const category = tournament?.categories.find((c) => c.id === catId);
      const isDoubles =
        category?.type === "DOUBLES" || category?.type === "MIXED";
      return (
        isDoubles &&
        (!partnerDetails.firstName ||
          !partnerDetails.lastName ||
          !partnerDetails.email)
      );
    });

    if (hasDoublesWithoutPartner) {
      toast.error("Please fill in partner details for doubles categories");
      return;
    }

    setRegistering(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const categoryId of selectedCategories) {
        const category = tournament?.categories.find(
          (c) => c.id === categoryId,
        );
        const isDoubles =
          category?.type === "DOUBLES" || category?.type === "MIXED";

        try {
          if (isDoubles) {
            // For doubles, create a team
            await api.post("/teams", {
              name: `${tournament?.name} - ${category?.name}`,
              tournamentId: id,
              categoryId: categoryId,
              captainId: user?.id,
              memberIds: [],
              partnerDetails: partnerDetails,
            });
          } else {
            // For singles, register directly
            await api.post("/registrations", {
              tournamentId: id,
              categoryId: categoryId,
            });
          }
          successCount++;
        } catch (err: any) {
          console.error(`Failed to register for category ${categoryId}:`, err);
          failCount++;
          toast.error(
            `Failed to register for ${category?.name}: ${err.response?.data?.message}`,
          );
        }
      }

      if (successCount > 0) {
        toast.success(
          `Registered for ${successCount} category(s) successfully!`,
        );
        if (partnerDetails.email) {
          toast.success(`Partner invitation sent to ${partnerDetails.email}`);
        }
      }
      if (failCount > 0) {
        toast.error(`Failed to register for ${failCount} category(s)`);
      }

      await fetchTournamentDetails();
      setSelectedCategories([]);
      setPartnerDetails({ firstName: "", lastName: "", email: "", phone: "" });
      setShowPartnerForm(false);
      setSelectedDoublesCategory(null);
    } catch (error: any) {
      console.error("Registration error:", error);
    } finally {
      setRegistering(false);
    }
  };

  /*const handleCreateGroups = async () => {
    if (selectedCategories.length === 0) {
      toast.error("Please select a category first");
      return;
    }
    if (creatingGroups) return;

    setCreatingGroups(true);
    const numGroups = prompt("How many groups? (e.g., 2, 4)", "2");
    if (!numGroups) {
      setCreatingGroups(false);
      return;
    }

    try {
      await api.post(
        `/groups/tournaments/${id}/categories/${selectedCategories[0]}/groups`,
        { numberOfGroups: parseInt(numGroups) },
      );
      toast.success("Groups created successfully!");
      setRefreshGroups((prev) => !prev);
      setShowGroupsModal(false);
      await fetchTournamentDetails();
    } catch (error) {
      console.error("Create groups error:", error);
      toast.error("Failed to create groups");
    } finally {
      setCreatingGroups(false);
    }
  };*/

  const handleRecordScores = () => {
    if (selectedCategories.length === 0) {
      toast.error("Please select a category first");
      return;
    }
    setShowScoreModal(true);
  };

  const handleGenerateGroupMatches = async () => {
    if (selectedCategories.length === 0) {
      toast.error("Please select a category first");
      return;
    }

    try {
      const response = await api.post(
        `/groups/tournaments/${id}/categories/${selectedCategories[0]}/group-matches`,
      );
      console.log("Generate matches response:", response.data);
      toast.success("Group matches generated!");
      await fetchTournamentDetails();
      setRefreshGroups((prev) => !prev);
    } catch (error) {
      toast.error("Failed to generate group matches");
    } finally {
      setGeneratingMatches(false);
    }
  };

  const handleResetKnockout = async () => {
    try {
      await api.delete(
        `/matches/tournaments/${id}/categories/${selectedCategories[0]}/knockout`,
      );
      toast.success("Knockout stage reset successfully");
      fetchTournamentDetails();
    } catch (error) {
      toast.error("Failed to reset knockout stage");
    } finally {
      setShowResetConfirm(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this tournament?")) {
      try {
        await api.delete(`/tournaments/${id}`);
        toast.success("Tournament deleted successfully");
        navigate("/tournaments");
      } catch (error) {
        toast.error("Failed to delete tournament");
      }
    }
  };

  const handleGenerateBracket = async (categoryId: string) => {
    if (
      !window.confirm("This will create matches for this category. Continue?")
    )
      return;
    setGenerating(categoryId);
    try {
      await api.post(
        `/brackets/tournaments/${id}/categories/${categoryId}/generate`,
      );
      toast.success("Bracket generated successfully!");
      fetchTournamentDetails();
    } catch (error) {
      toast.error("Failed to generate bracket");
    } finally {
      setGenerating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "bg-blue-100 text-blue-800";
      case "ONGOING":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRegistrationStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const fetchWinners = async () => {
    try {
      const matchesResponse = await api.get(`/matches/tournaments/${id}`);
      const allMatches = matchesResponse.data.data;
      const finalMatch = allMatches.find((m: any) => m.round === "Final");
      const thirdPlaceMatch = allMatches.find(
        (m: any) => m.round === "3rd Place",
      );
      let champion = null,
        runnerUp = null,
        thirdPlace = null;
      if (finalMatch && finalMatch.winnerId) {
        const isPlayer1Winner = finalMatch.winnerId === finalMatch.player1Id;
        champion = isPlayer1Winner ? finalMatch.player1 : finalMatch.player2;
        runnerUp = isPlayer1Winner ? finalMatch.player2 : finalMatch.player1;
      }
      if (thirdPlaceMatch && thirdPlaceMatch.winnerId) {
        const isPlayer1Winner =
          thirdPlaceMatch.winnerId === thirdPlaceMatch.player1Id;
        thirdPlace = isPlayer1Winner
          ? thirdPlaceMatch.player1
          : thirdPlaceMatch.player2;
      }
      setWinners({ first: champion, second: runnerUp, third: thirdPlace });
      setShowWinners(true);
    } catch (error) {
      console.error("Failed to fetch winners", error);
    }
  };
  // Add category to edit
  const addEditCategory = () => {
    setEditCategories([
      ...editCategories,
      {
        id: `temp-${Date.now()}`,
        name: "",
        type: "SINGLES",
        maxParticipants: 32,
        currentParticipants: 0,
        minAge: undefined,
        maxAge: undefined,
      },
    ]);
  };

  // Remove category from edit
  const removeEditCategory = (index: number) => {
    const newCategories = [...editCategories];
    newCategories.splice(index, 1);
    setEditCategories(newCategories);
  };

  // Update category in edit
  const updateEditCategory = (
    index: number,
    field: keyof Category,
    value: any,
  ) => {
    const newCategories = [...editCategories];
    newCategories[index] = { ...newCategories[index], [field]: value };
    setEditCategories(newCategories);
  };

  const handleUpdateTournament = async () => {
    try {
      await api.patch(`/tournaments/${id}`, {
        name: editFormData.name,
        description: editFormData.description,
        venue: editFormData.venue,
        startDate: new Date(editFormData.startDate).toISOString(),
        endDate: new Date(editFormData.endDate).toISOString(),
        registrationDeadline: new Date(
          editFormData.registrationDeadline,
        ).toISOString(),
        maxPlayers: editFormData.maxPlayers
          ? parseInt(editFormData.maxPlayers)
          : null,
      });
      // Get existing categories from backend
      const existingCategories = await api.get(`/tournaments/${id}/categories`);
      const existingIds = existingCategories.data.data.map((c: any) => c.id);

      // Create new categories and update existing ones
      for (const category of editCategories) {
        if (category.id.startsWith("temp-")) {
          // This is a new category - create it
          await api.post(`/tournaments/${id}/categories`, {
            name: category.name,
            type: category.type,
            minAge: category.minAge,
            maxAge: category.maxAge,
            maxParticipants: category.maxParticipants,
          });
        } else if (existingIds.includes(category.id)) {
          // This is an existing category - update it
          await api.patch(`/tournaments/categories/${category.id}`, {
            name: category.name,
            type: category.type,
            minAge: category.minAge,
            maxAge: category.maxAge,
            maxParticipants: category.maxParticipants,
          });
        }
      }

      // Delete categories that were removed
      const currentIds = editCategories.map((c) => c.id);
      const categoriesToDelete = existingIds.filter(
        (id: string) => !currentIds.includes(id),
      );

      for (const categoryId of categoriesToDelete) {
        await api.delete(`/tournaments/categories/${categoryId}`);
      }

      toast.success("Tournament updated successfully!");
      setShowEditModal(false);
      fetchTournamentDetails();
    } catch (error) {
      toast.error("Failed to update tournament");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading tournament details...
      </div>
    );
  }

  if (!tournament) {
    return <div className="text-center py-12">Tournament not found</div>;
  }

  const isRegistrationOpen =
    tournament.status === "UPCOMING" &&
    new Date() < new Date(tournament.registrationDeadline);
  const isPlayer = user?.role === "PLAYER";
  const isAdmin = user?.role === "ADMIN";
  const isReferee = user?.role === "REFEREE";

  const userRegistrations =
    tournament.registrations?.filter((r) => r.playerId === user?.id) || [];
  const hasRegistration = userRegistrations.length > 0;
  const canRegister = isPlayer && isRegistrationOpen;

  const eligibleCategories = tournament.categories.filter((c) =>
    isPlayerEligibleForCategory(c, playerAge),
  );
  const ineligibleCategories = tournament.categories.filter(
    (c) => !isPlayerEligibleForCategory(c, playerAge),
  );

  // Function to check if category is doubles
  const isDoublesCategory = (categoryType: string) => {
    return categoryType === "DOUBLES" || categoryType === "MIXED";
  };

  return (
    <div>
      {/* Tournament Header */}
      <div className="card mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {tournament.name}
            </h1>
            <p className="text-gray-600 mb-4">
              {tournament.description || "No description available"}
            </p>
          </div>
          <div className="flex gap-2">
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(tournament.status)}`}
            >
              {tournament.status}
            </span>
            {isAdmin && (
              <>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-lg text-sm"
                >
                  Delete Tournament
                </button>
                <button
                  onClick={() => {
                    setEditFormData({
                      name: tournament.name,
                      description: tournament.description || "",
                      venue: tournament.venue,
                      startDate: tournament.startDate.slice(0, 16),
                      endDate: tournament.endDate.slice(0, 16),
                      registrationDeadline:
                        tournament.registrationDeadline.slice(0, 16),
                      maxPlayers: tournament.maxPlayers?.toString() || "",
                    });
                    setShowEditModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-lg text-sm"
                >
                  Edit Tournament
                </button>
              </>
            )}
            <button
              onClick={fetchWinners}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded-lg text-sm"
            >
              Show Winners
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-500">Venue</p>
            <p className="font-medium">{tournament.venue}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Start Date</p>
            <p className="font-medium">
              {new Date(tournament.startDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">End Date</p>
            <p className="font-medium">
              {new Date(tournament.endDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Registration Deadline</p>
            <p className="font-medium">
              {new Date(tournament.registrationDeadline).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Tournament Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Edit Tournament
            </h2>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tournament Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Venue
                  </label>
                  <input
                    type="text"
                    value={editFormData.venue}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        venue: e.target.value,
                      })
                    }
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      description: e.target.value,
                    })
                  }
                  rows={2}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    value={editFormData.startDate}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        startDate: e.target.value,
                      })
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    value={editFormData.endDate}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        endDate: e.target.value,
                      })
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={editFormData.registrationDeadline}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        registrationDeadline: e.target.value,
                      })
                    }
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Players (Optional)
                </label>
                <input
                  type="number"
                  value={editFormData.maxPlayers}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      maxPlayers: e.target.value,
                    })
                  }
                  className="input-field"
                  min="2"
                />
              </div>

              {/* Categories Section */}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Categories
                  </h3>
                  <button
                    type="button"
                    onClick={addEditCategory}
                    className="bg-primary-600 text-white px-3 py-1 rounded text-sm hover:bg-primary-700"
                  >
                    + Add Category
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {editCategories.map((category, index) => (
                    <div
                      key={category.id}
                      className="border rounded-lg p-3 bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">Category {index + 1}</h4>
                        {editCategories.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEditCategory(index)}
                            className="text-red-600 text-sm hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Category Name"
                          value={category.name}
                          onChange={(e) =>
                            updateEditCategory(index, "name", e.target.value)
                          }
                          className="input-field text-sm"
                        />
                        <select
                          value={category.type}
                          onChange={(e) =>
                            updateEditCategory(index, "type", e.target.value)
                          }
                          className="input-field text-sm"
                        >
                          <option value="SINGLES">Singles</option>
                          <option value="DOUBLES">Doubles</option>
                          <option value="TEAM">Team</option>
                        </select>
                        <div className="flex gap-2 col-span-2">
                          <input
                            type="number"
                            placeholder="Min Age"
                            value={category.minAge || ""}
                            onChange={(e) =>
                              updateEditCategory(
                                index,
                                "minAge",
                                e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              )
                            }
                            className="input-field text-sm w-1/2"
                          />
                          <input
                            type="number"
                            placeholder="Max Age"
                            value={category.maxAge || ""}
                            onChange={(e) =>
                              updateEditCategory(
                                index,
                                "maxAge",
                                e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              )
                            }
                            className="input-field text-sm w-1/2"
                          />
                        </div>
                        <input
                          type="number"
                          placeholder="Max Participants"
                          value={category.maxParticipants}
                          onChange={(e) =>
                            updateEditCategory(
                              index,
                              "maxParticipants",
                              parseInt(e.target.value),
                            )
                          }
                          className="input-field text-sm col-span-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {editCategories.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No categories. Click "Add Category" to create one.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpdateTournament}
                  className="btn-primary flex-1"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories Section */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Categories</h2>
        {tournament.categories.length === 0 ? (
          <p className="text-gray-500">
            No categories available for this tournament.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournament.categories.map((category) => (
              <div key={category.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {category.name}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {category.type}
                    </span>
                  </div>
                  {isAdmin && tournamentType === "KNOCKOUT" && (
                    <button
                      onClick={() => handleGenerateBracket(category.id)}
                      disabled={generating === category.id}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                    >
                      {generating === category.id
                        ? "Generating..."
                        : "🎲 Generate Bracket"}
                    </button>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  <p>
                    Participants: {category.currentParticipants} /{" "}
                    {category.maxParticipants}
                  </p>
                  <p>
                    Spots left:{" "}
                    {category.maxParticipants - category.currentParticipants}
                  </p>
                  {(category.minAge || category.maxAge) && (
                    <p className="text-xs text-gray-500 mt-1">
                      Age: {category.minAge ? `${category.minAge}+` : ""}
                      {category.minAge && category.maxAge ? " - " : ""}
                      {category.maxAge ? `Under ${category.maxAge}` : ""}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Selector for Group Stage */}
      {tournamentType === "GROUP_KNOCKOUT" &&
        tournament.categories.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Select Category for Group Stage
            </h2>
            <select
              value={selectedCategories[0] || ""}
              onChange={(e) => setSelectedCategories([e.target.value])}
              className="input-field max-w-md"
            >
              <option value="">Select a category</option>
              {tournament.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.type}) -{" "}
                  {category.currentParticipants}/{category.maxParticipants}{" "}
                  players
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Select a category to manage groups and knockout stage
            </p>
          </div>
        )}

      {/* Group Stage UI */}
      {tournamentType === "GROUP_KNOCKOUT" && selectedCategories.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Group Stage Management -{" "}
            {
              tournament.categories.find((c) => c.id === selectedCategories[0])
                ?.name
            }
          </h2>
          <div className="flex flex-wrap gap-3 mb-6">
            {isAdmin ||
              (isReferee && (
                <>
                  <button
                    onClick={() => setShowGroupsModal(true)}
                    className="btn-primary"
                  >
                    Create / Edit Groups
                  </button>
                  <button
                    onClick={handleGenerateGroupMatches}
                    className="btn-primary"
                  >
                    Generate Group Matches
                  </button>
                  <button onClick={handleRecordScores} className="btn-primary">
                    Record Group Scores
                  </button>
                  <button
                    onClick={() => setShowKnockoutModal(true)}
                    className="btn-primary"
                  >
                    Generate Knockout Stage
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                  >
                    Reset Knockout Stage
                  </button>
                </>
              ))}
          </div>
          <GroupStandings
            tournamentId={id}
            categoryId={selectedCategories[0]}
            isAdminOrReferee={isAdmin || isReferee}
            onScoreUpdate={fetchTournamentDetails}
            key={refreshGroups ? "refresh" : "initial"}
          />
        </div>
      )}

      {/* Knockout Bracket */}
      {selectedCategories.length > 0 && (
        <div
          className="card mb-6"
          style={{ overflowX: "auto", overflowY: "visible", minHeight: 200 }}
        >
          <KnockoutBracket
            tournamentId={id}
            categoryId={selectedCategories[0]}
            onScoreRecorded={fetchTournamentDetails}
          />
        </div>
      )}
      {/* Winners Section */}
      {showWinners && winners && (
        <div className="card mb-6 bg-gradient-to-r from-yellow-50 to-amber-50">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            🏆 Tournament Champions 🏆
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-yellow-100 rounded-lg p-4">
              <div className="text-5xl mb-2">🥇</div>
              <h3 className="font-bold text-xl text-gray-900">Champion</h3>
              <p className="text-lg font-semibold text-yellow-700">
                {winners.first?.firstName} {winners.first?.lastName}
              </p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="text-5xl mb-2">🥈</div>
              <h3 className="font-bold text-xl text-gray-900">Runner-up</h3>
              <p className="text-lg font-semibold text-gray-700">
                {winners.second?.firstName} {winners.second?.lastName}
              </p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <div className="text-5xl mb-2">🥉</div>
              <h3 className="font-bold text-xl text-gray-900">
                Second Runner-up
              </h3>
              <p className="text-lg font-semibold text-amber-700">
                {winners.third?.firstName} {winners.third?.lastName || "TBD"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Registration Form with Age Filtering */}
      {canRegister && tournament.categories.length > 0 && (
        <div className="card mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            Register for this Tournament
          </h3>
          {playerAge !== null && (
            <div className="bg-blue-50 p-3 rounded mb-4">
              Your age: <strong>{playerAge} years</strong>
            </div>
          )}

          <p className="text-sm text-gray-600 mb-3">
            Select categories to register:
          </p>

          <div className="space-y-2 mb-4">
            {eligibleCategories.map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              const isFull =
                category.currentParticipants >= category.maxParticipants;
              const isDoubles = isDoublesCategory(category.type);

              return (
                <div key={category.id}>
                  <label
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${isSelected ? "border-primary-500 bg-primary-50" : "border-green-200 bg-green-50"} ${isFull ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (!isFull) {
                            if (isDoubles) {
                              setSelectedDoublesCategory(category.id);
                              setShowPartnerForm(true);
                            }
                            toggleCategory(category.id);
                          }
                        }}
                        disabled={isFull}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-xs text-gray-500">
                          {category.type} • {category.currentParticipants}/
                          {category.maxParticipants} participants
                          {isDoubles && (
                            <span className="ml-2 text-blue-600">
                              (Team registration - need partner)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    {isFull && (
                      <span className="text-red-500 text-sm">Full</span>
                    )}
                  </label>

                  {/* Partner Form for Doubles */}
                  {isDoubles &&
                    showPartnerForm &&
                    selectedDoublesCategory === category.id && (
                      <div className="mt-3 p-4 border border-blue-200 rounded-lg bg-blue-50">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Partner Details
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Partner First Name"
                            value={partnerDetails.firstName}
                            onChange={(e) =>
                              setPartnerDetails({
                                ...partnerDetails,
                                firstName: e.target.value,
                              })
                            }
                            className="input-field text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Partner Last Name"
                            value={partnerDetails.lastName}
                            onChange={(e) =>
                              setPartnerDetails({
                                ...partnerDetails,
                                lastName: e.target.value,
                              })
                            }
                            className="input-field text-sm"
                          />
                          <input
                            type="email"
                            placeholder="Partner Email"
                            value={partnerDetails.email}
                            onChange={(e) =>
                              setPartnerDetails({
                                ...partnerDetails,
                                email: e.target.value,
                              })
                            }
                            className="input-field text-sm col-span-2"
                          />
                          <input
                            type="tel"
                            placeholder="Partner Phone (Optional)"
                            value={partnerDetails.phone}
                            onChange={(e) =>
                              setPartnerDetails({
                                ...partnerDetails,
                                phone: e.target.value,
                              })
                            }
                            className="input-field text-sm col-span-2"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          The partner will be notified and added to your team
                        </p>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
          {/* Show ineligible categories (disabled) */}
          {ineligibleCategories.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">
                Not eligible for these categories (age restriction):
              </p>
              {ineligibleCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center p-3 border border-gray-200 rounded-lg bg-gray-50 opacity-60 mb-2"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      disabled
                      className="w-4 h-4 text-gray-400 rounded"
                    />
                    <div>
                      <p className="font-medium text-gray-500">
                        {category.name}
                      </p>
                      <p className="text-xs text-gray-400">{category.type}</p>
                    </div>
                  </div>
                  <span className="ml-auto text-xs text-red-400">
                    {playerAge &&
                      category.minAge &&
                      playerAge < category.minAge &&
                      `Need ${category.minAge}+`}
                    {playerAge &&
                      category.maxAge &&
                      playerAge > category.maxAge &&
                      `Under ${category.maxAge}`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {selectedCategories.length > 0 && (
            <div className="bg-blue-50 p-3 rounded mb-4">
              Selected {selectedCategories.length} category(s)
            </div>
          )}

          <button
            onClick={handleRegister}
            disabled={registering || selectedCategories.length === 0}
            className="btn-primary w-full"
          >
            {registering
              ? "Registering..."
              : `Register for ${selectedCategories.length} Category(s)`}
          </button>
          <button
            onClick={() => setShowGuestModal(true)}
            className="btn-secondary"
          >
            Register as Guest
          </button>
        </div>
      )}
      {hasRegistration && (
        <div className="card mb-6">
          <p className="text-sm text-blue-800">Your registration status:</p>
          {userRegistrations.map((reg) => (
            <span
              key={reg.id}
              className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${getRegistrationStatusColor(reg.status)}`}
            >
              {reg.status}
            </span>
          ))}
        </div>
      )}

      {/* Registrations Section */}
      {(isAdmin || isReferee) && tournament.registrations?.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Registrations ({tournament.registrations.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tournament.registrations.map((registration) => (
                  <tr key={registration.id} className="hover:bg-gray-50">
                    <Link
                      to={`/profile/${registration.player.id}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      {registration.player.firstName}{" "}
                      {registration.player.lastName}
                    </Link>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {registration.category?.name || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {registration.player.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(registration.registeredAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          registration.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : registration.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {registration.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Modals */}
      {showGroupsModal && (
        <CreateGroupsModal
          tournamentId={id}
          categoryId={selectedCategories[0]}
          onClose={() => setShowGroupsModal(false)}
          onSuccess={fetchTournamentDetails}
        />
      )}
      {showKnockoutModal && (
        <CreateKnockoutModal
          tournamentId={id}
          categoryId={selectedCategories[0]}
          onClose={() => setShowKnockoutModal(false)}
          onSuccess={fetchTournamentDetails}
        />
      )}
      {showScoreModal && (
        <RecordGroupScoreModal
          tournamentId={id}
          categoryId={selectedCategories[0]}
          onClose={() => setShowScoreModal(false)}
          onSuccess={fetchTournamentDetails}
        />
      )}
      {/* Guest Registration Modal */}
      {showGuestModal && (
        <GuestRegistrationModal
          tournamentId={id}
          tournamentName={tournament.name}
          selectedCategories={selectedCategories}
          categories={tournament.categories}
          onClose={() => setShowGuestModal(false)}
          onSuccess={fetchTournamentDetails}
        />
      )}
      {showResetConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              maxWidth: 420,
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              fontFamily: "'Segoe UI',system-ui,sans-serif",
            }}
          >
            {/* Header */}
            <div
              style={{
                background: "#fef2f2",
                padding: "20px 24px",
                borderBottom: "1px solid #fecaca",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "#fee2e2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                  }}
                >
                  ⚠️
                </div>
                <div>
                  <div
                    style={{ fontWeight: 800, color: "#991b1b", fontSize: 16 }}
                  >
                    Reset Knockout Stage
                  </div>
                  <div style={{ fontSize: 12, color: "#b91c1c" }}>
                    This action cannot be undone
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 24px" }}>
              <p
                style={{
                  margin: "0 0 12px",
                  color: "#374151",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                This will permanently delete{" "}
                <strong>all knockout matches and recorded scores</strong>. The
                group stage results will remain intact.
              </p>
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#991b1b",
                }}
              >
                You will need to regenerate the knockout bracket after
                resetting.
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "14px 24px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                gap: 10,
                background: "#f8fafc",
              }}
            >
              <button
                onClick={() => setShowResetConfirm(false)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 10,
                  background: "#fff",
                  color: "#475569",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleResetKnockout}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  border: "none",
                  borderRadius: 10,
                  background: "#dc2626",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}
      {isAdmin && tournament.status !== "COMPLETED" && (
        <button
          onClick={async () => {
            try {
              await api.patch(`/tournaments/${id}`, { status: "COMPLETED" });
              toast.success("Tournament marked as completed!");
              fetchTournamentDetails();
              setTimeout(() => fetchWinners(), 500);
            } catch {
              toast.error("Failed to update status");
            }
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-lg text-sm"
        >
          Mark Complete
        </button>
      )}
      {/* Winner Celebration Modal */}
      {showCelebration && winners && winners.first && (
        <WinnerCelebration
          winnerName={`${winners.first.firstName} ${winners.first.lastName}`}
          onClose={() => setShowCelebration(false)}
        />
      )}
    </div>
  );
};

export default TournamentDetails;
